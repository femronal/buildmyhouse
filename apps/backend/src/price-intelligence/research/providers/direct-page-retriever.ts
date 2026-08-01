/**
 * Stage 4 STEP 4 — DirectPublicPageRetriever.
 *
 * First-party, lawful public-page retrieval from the BuildMyHouse backend.
 * Safety (founder section 5):
 *  - clear BuildMyHouse user agent;
 *  - sensible timeouts + bounded retries + max response size;
 *  - rejects unsafe URL schemes;
 *  - SSRF protection: resolves DNS and blocks private/internal IP ranges;
 *  - respects robots.txt and per-source access policy;
 *  - never bypasses login/CAPTCHA/rate limits.
 *
 * Parsing is dependency-free (JSON-LD, Open Graph, microdata, readable text).
 * We store the RETRIEVAL OUTCOME, not merely a price.
 */
import * as dns from 'dns';
import { promisify } from 'util';
import { PageRetriever, RetrievedPage, RetrievalOutcome, StructuredProductData } from './types';
import { ResearchConfig } from '../research.config';
import { canDirectFetch, domainOf } from '../source-registry';

const lookup = promisify(dns.lookup);

function isPrivateIp(ip: string): boolean {
  // IPv6 loopback/link-local/unique-local
  if (ip.includes(':')) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return isPrivateIp(v.replace('::ffff:', '')); // IPv4-mapped
    return v === '::1' || v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd');
  }
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true; // reject unparseable
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast/reserved
  return false;
}

async function assertSafeHost(hostname: string): Promise<{ safe: boolean; reason?: string }> {
  // Block obvious internal names
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal')) {
    return { safe: false, reason: 'internal hostname' };
  }
  try {
    const addresses = await lookup(hostname, { all: true });
    if (addresses.length === 0) return { safe: false, reason: 'no DNS resolution' };
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) return { safe: false, reason: `resolves to private IP ${addr.address}` };
    }
    return { safe: true };
  } catch {
    return { safe: false, reason: 'DNS lookup failed' };
  }
}

// --- Robots (minimal, conservative, in-memory cached) ---
const robotsCache = new Map<string, { disallow: string[]; fetchedAt: number }>();
const ROBOTS_TTL_MS = 6 * 60 * 60 * 1000;

async function isAllowedByRobots(url: URL, userAgent: string, timeoutMs: number): Promise<boolean> {
  const host = url.origin;
  let entry = robotsCache.get(host);
  if (!entry || Date.now() - entry.fetchedAt > ROBOTS_TTL_MS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 8000));
      const res = await fetch(`${host}/robots.txt`, {
        headers: { 'User-Agent': userAgent },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const disallow: string[] = [];
      if (res.ok) {
        const text = await res.text();
        let appliesToUs = false;
        for (const line of text.split('\n')) {
          const l = line.trim();
          if (/^user-agent:/i.test(l)) {
            const agent = l.split(':')[1]?.trim().toLowerCase() ?? '';
            appliesToUs = agent === '*' || userAgent.toLowerCase().includes(agent);
          } else if (appliesToUs && /^disallow:/i.test(l)) {
            const path = l.split(':')[1]?.trim() ?? '';
            if (path) disallow.push(path);
          }
        }
      }
      entry = { disallow, fetchedAt: Date.now() };
      robotsCache.set(host, entry);
    } catch {
      entry = { disallow: [], fetchedAt: Date.now() };
      robotsCache.set(host, entry);
    }
  }
  return !entry.disallow.some((p) => url.pathname.startsWith(p));
}

// --- Parsing (dependency-free) ---
function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      /* ignore malformed block */
    }
  }
  return blocks;
}

function extractOpenGraph(html: string): Record<string, string> {
  const og: Record<string, string> = {};
  const re = /<meta[^>]+(?:property|name)=["'](og:[^"']+|product:[^"']+|twitter:[^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) og[m[1]] = m[2];
  return og;
}

function extractMicrodata(html: string): Record<string, string> {
  const md: Record<string, string> = {};
  const re = /itemprop=["']([^"']+)["'][^>]*content=["']([^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) md[m[1]] = m[2];
  return md;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, ' ').slice(0, 300) : null;
}

function toReadableText(html: string, maxChars = 20000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

export class DirectPublicPageRetriever implements PageRetriever {
  readonly name = 'direct_public';
  constructor(private readonly config: ResearchConfig) {}

  private fail(url: string, outcome: RetrievalOutcome, reason: string, httpStatus: number | null = null): RetrievedPage {
    return {
      url,
      finalUrl: url,
      sourceDomain: domainOf(url),
      outcome,
      httpStatus,
      contentType: null,
      title: null,
      readableText: '',
      structured: { jsonLd: [], openGraph: {}, microdata: {} },
      fetchedAt: new Date().toISOString(),
      bytes: 0,
      restrictionReason: reason,
    };
  }

  async retrieve(rawUrl: string, signal?: AbortSignal): Promise<RetrievedPage> {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return this.fail(rawUrl, 'unsafe_url_rejected', 'malformed URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return this.fail(rawUrl, 'unsafe_url_rejected', `unsafe scheme ${url.protocol}`);
    }

    const access = canDirectFetch(rawUrl);
    if (!access.allowed) {
      return this.fail(rawUrl, 'robots_or_policy_restricted', access.reason);
    }

    const safety = await assertSafeHost(url.hostname);
    if (!safety.safe) {
      return this.fail(rawUrl, 'unsafe_url_rejected', `SSRF guard: ${safety.reason}`);
    }

    const allowedByRobots = await isAllowedByRobots(url, this.config.userAgent, this.config.pageFetchTimeoutMs);
    if (!allowedByRobots) {
      return this.fail(rawUrl, 'robots_or_policy_restricted', 'robots.txt disallows this path');
    }

    let lastErr = 'fetch_failed';
    for (let attempt = 0; attempt <= this.config.pageFetchMaxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
        const timer = setTimeout(() => controller.abort(), this.config.pageFetchTimeoutMs);

        const res = await fetch(url.toString(), {
          headers: {
            'User-Agent': this.config.userAgent,
            Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5',
          },
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);

        // Re-check the final URL host after redirects (SSRF via redirect).
        const finalUrl = new URL(res.url || url.toString());
        if (finalUrl.hostname !== url.hostname) {
          const redirectSafety = await assertSafeHost(finalUrl.hostname);
          if (!redirectSafety.safe) return this.fail(rawUrl, 'unsafe_url_rejected', `redirect SSRF: ${redirectSafety.reason}`);
        }

        if (res.status === 401 || res.status === 403) {
          return this.fail(rawUrl, 'login_required', `HTTP ${res.status}`, res.status);
        }
        if (res.status === 429) {
          return this.fail(rawUrl, 'blocked_by_source', 'HTTP 429 rate limited', res.status);
        }
        if (!res.ok) {
          lastErr = `HTTP ${res.status}`;
          if (res.status >= 500 && attempt < this.config.pageFetchMaxRetries) continue;
          return this.fail(rawUrl, 'fetch_failed', lastErr, res.status);
        }

        const contentType = res.headers.get('content-type');
        const contentLength = Number(res.headers.get('content-length') ?? '0');
        if (contentLength && contentLength > this.config.maxPageBytes) {
          return this.fail(rawUrl, 'unsupported_content', `content-length ${contentLength} exceeds cap`, res.status);
        }
        if (contentType && !/text\/html|application\/xhtml|application\/json|text\/plain/i.test(contentType)) {
          // PDFs and other binaries are not parsed dependency-free here.
          return this.fail(rawUrl, 'unsupported_content', `unsupported content-type ${contentType}`, res.status);
        }

        // Bounded read.
        const buf = await res.arrayBuffer();
        if (buf.byteLength > this.config.maxPageBytes) {
          return this.fail(rawUrl, 'unsupported_content', `body ${buf.byteLength} exceeds cap`, res.status);
        }
        const html = Buffer.from(buf).toString('utf8');

        const structured: StructuredProductData = {
          jsonLd: extractJsonLd(html),
          openGraph: extractOpenGraph(html),
          microdata: extractMicrodata(html),
        };
        const readableText = toReadableText(html);
        const hasStructured = structured.jsonLd.length > 0 || Object.keys(structured.openGraph).length > 0;
        const hasText = readableText.length > 40;

        let outcome: RetrievalOutcome;
        if (hasStructured) outcome = 'structured_data_found';
        else if (hasText) outcome = 'readable_text_found';
        else outcome = 'no_useful_content';

        // Heuristic: near-empty HTML that references heavy client JS suggests SPA rendering.
        if (!hasStructured && !hasText && /__NEXT_DATA__|window\.__NUXT__|id=["']root["']/.test(html)) {
          outcome = 'dynamic_rendering_required';
        }

        return {
          url: rawUrl,
          finalUrl: finalUrl.toString(),
          sourceDomain: domainOf(finalUrl.toString()),
          outcome,
          httpStatus: res.status,
          contentType,
          title: extractTitle(html),
          readableText,
          structured,
          fetchedAt: new Date().toISOString(),
          bytes: buf.byteLength,
        };
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        const aborted = err instanceof Error && err.name === 'AbortError';
        if (aborted) return this.fail(rawUrl, 'timeout', `timeout after ${this.config.pageFetchTimeoutMs}ms`);
        if (attempt >= this.config.pageFetchMaxRetries) return this.fail(rawUrl, 'fetch_failed', lastErr);
      }
    }
    return this.fail(rawUrl, 'fetch_failed', lastErr);
  }
}

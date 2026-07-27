export type BlogTocItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

export type BlogReadingAids = {
  toc: BlogTocItem[];
  takeaways: string[];
};

type JsonObject = Record<string, unknown>;

const MAX_TAKEAWAYS = 5;
const MAX_TOC_ITEMS = 14;

export function slugifyHeading(text: string): string {
  const base = String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return base || 'section';
}

function uniqueSlug(text: string, used: Set<string>): string {
  const base = slugifyHeading(text);
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function collectText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as JsonObject;
  if (typeof n.text === 'string') return n.text;
  const content = Array.isArray(n.content) ? n.content : [];
  return content.map(collectText).join('');
}

function walkTipTap(node: unknown, visit: (n: JsonObject) => void) {
  if (!node || typeof node !== 'object') return;
  const n = node as JsonObject;
  visit(n);
  const content = Array.isArray(n.content) ? n.content : [];
  for (const child of content) walkTipTap(child, visit);
}

/** Extract H2/H3 headings from TipTap JSON in document order. */
export function extractTocFromTipTap(content: unknown): BlogTocItem[] {
  const used = new Set<string>();
  const toc: BlogTocItem[] = [];
  walkTipTap(content, (n) => {
    if (n.type !== 'heading') return;
    const attrs = (n.attrs && typeof n.attrs === 'object' ? n.attrs : {}) as JsonObject;
    const level = Number(attrs.level) === 3 ? 3 : 2;
    const title = collectText(n).replace(/\s+/g, ' ').trim();
    if (!title) return;
    toc.push({ id: uniqueSlug(title, used), title, level });
  });
  return toc.slice(0, MAX_TOC_ITEMS);
}

/** First bullet/ordered list items in TipTap content (good default takeaways). */
export function extractFirstListItemsFromTipTap(content: unknown, limit = MAX_TAKEAWAYS): string[] {
  let found: string[] | null = null;
  walkTipTap(content, (n) => {
    if (found) return;
    if (n.type !== 'bulletList' && n.type !== 'orderedList') return;
    const items = Array.isArray(n.content) ? n.content : [];
    const texts = items
      .map((item) => collectText(item).replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (texts.length) found = texts;
  });
  return (found || []).slice(0, limit);
}

function splitSentences(text: string): string[] {
  return String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24);
}

export function deriveArticleTakeaways(input: {
  keyTakeaways?: string[] | null;
  content?: unknown;
  excerpt?: string;
  description?: string;
  faqs?: Array<{ question?: string; answer?: string }>;
}): string[] {
  const explicit = (input.keyTakeaways || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  if (explicit.length) return explicit.slice(0, MAX_TAKEAWAYS);

  const fromList = extractFirstListItemsFromTipTap(input.content);
  if (fromList.length >= 2) return fromList;

  const fromFaqs = (input.faqs || [])
    .map((faq) => String(faq.question || '').trim())
    .filter(Boolean)
    .slice(0, MAX_TAKEAWAYS);
  if (fromFaqs.length >= 2) return fromFaqs;

  const fromExcerpt = splitSentences(input.excerpt || '').slice(0, 3);
  if (fromExcerpt.length) return fromExcerpt;

  const description = String(input.description || '').trim();
  return description ? [description] : fromList;
}

export function buildArticleReadingAids(input: {
  keyTakeaways?: string[] | null;
  content?: unknown;
  excerpt?: string;
  description?: string;
  faqs?: Array<{ question?: string; answer?: string }>;
}): BlogReadingAids {
  return {
    toc: extractTocFromTipTap(input.content),
    takeaways: deriveArticleTakeaways(input),
  };
}

/** Inject id attributes onto h2/h3 tags in generated article HTML (order-matched). */
export function injectHeadingIdsIntoHtml(html: string, toc: BlogTocItem[]): string {
  if (!html || !toc.length) return html;
  let index = 0;
  return html.replace(/<h([23])(\s[^>]*)?>/gi, (match, level, attrs = '') => {
    if (/\sid\s*=/.test(attrs)) return match;
    const item = toc[index];
    index += 1;
    if (!item) return match;
    const id = item.id.replace(/"/g, '');
    return `<h${level}${attrs || ''} id="${id}">`;
  });
}

type StoryLikeBlock =
  | { type: 'h2'; id?: string; text: string }
  | { type: 'h3'; text: string }
  | { type: 'pull'; text: string }
  | { type: string; [key: string]: unknown };

export function extractTocFromStoryBlocks(blocks: readonly StoryLikeBlock[]): BlogTocItem[] {
  const used = new Set<string>();
  const toc: BlogTocItem[] = [];
  for (const block of blocks) {
    if (block.type === 'h2') {
      const title = String(block.text || '').trim();
      if (!title) continue;
      const preferred = String(block.id || '').trim();
      const id = preferred && !used.has(preferred) ? preferred : uniqueSlug(title, used);
      used.add(id);
      toc.push({ id, title, level: 2 });
    } else if (block.type === 'h3') {
      const title = String(block.text || '').trim();
      if (!title) continue;
      toc.push({ id: uniqueSlug(title, used), title, level: 3 });
    }
  }
  return toc.slice(0, MAX_TOC_ITEMS);
}

/** Prefer pull-quotes as takeaways; fall back to first short list. */
export function deriveStoryTakeaways(blocks: readonly StoryLikeBlock[]): string[] {
  const pulls = blocks
    .filter((b): b is { type: 'pull'; text: string } => b.type === 'pull')
    .map((b) => String(b.text || '').trim())
    .filter(Boolean);
  if (pulls.length) return pulls.slice(0, MAX_TAKEAWAYS);

  for (const block of blocks) {
    if (block.type !== 'list' && block.type !== 'numbered') continue;
    const items = Array.isArray(block.items)
      ? block.items.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
    if (items.length >= 2) return items.slice(0, MAX_TAKEAWAYS);
  }
  return [];
}

export function buildStoryReadingAids(blocks: readonly StoryLikeBlock[]): BlogReadingAids {
  return {
    toc: extractTocFromStoryBlocks(blocks),
    takeaways: deriveStoryTakeaways(blocks),
  };
}

export function readingProgressFromOffsets(
  offsetY: number,
  contentHeight: number,
  viewportHeight: number,
): number {
  const travel = Math.max(contentHeight - viewportHeight, 1);
  const raw = offsetY / travel;
  if (!Number.isFinite(raw)) return 0;
  return Math.min(1, Math.max(0, raw));
}

export function scrollToReadingAnchor(id: string) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

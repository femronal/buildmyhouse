import type { LandingServiceLink } from '@buildmyhouse/shared-types';
import { matchesKeywordPhraseQuery, tokenizeSearchQuery } from '@/lib/keyword-search';

function slugLabel(href: string) {
  return href.split('/').pop()?.replace(/-/g, ' ') ?? '';
}

function scoreServicePageMatch(query: string, link: LandingServiceLink): number {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;

  const label = link.label.toLowerCase();
  const slug = slugLabel(link.href).toLowerCase();

  if (label === needle) return 120;
  if (label.startsWith(needle)) return 100;
  if (label.includes(needle)) return 80;
  if (slug.startsWith(needle)) return 70;
  if (slug.includes(needle)) return 60;

  const tokens = tokenizeSearchQuery(needle);
  if (tokens.length && tokens.every((token) => label.includes(token) || slug.includes(token))) {
    return 50;
  }

  return matchesKeywordPhraseQuery({
    query: needle,
    fields: [link.label, slug, link.href],
  })
    ? 40
    : 0;
}

export function filterServicePageLinks(
  query: string,
  links: LandingServiceLink[],
  limit = 8,
): LandingServiceLink[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const seen = new Set<string>();
  const ranked = links
    .map((link) => ({ link, score: scoreServicePageMatch(trimmed, link) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.link.label.localeCompare(b.link.label),
    );

  const results: LandingServiceLink[] = [];
  for (const { link } of ranked) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    results.push(link);
    if (results.length >= limit) break;
  }

  return results;
}

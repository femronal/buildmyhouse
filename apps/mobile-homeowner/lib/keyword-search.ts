const COMMON_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

export function tokenizeSearchQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !COMMON_STOP_WORDS.has(token));
}

export function matchesKeywordPhraseQuery(params: {
  query: string;
  fields: Array<string | null | undefined>;
}): boolean {
  const normalizedQuery = params.query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const searchCorpus = params.fields
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (!searchCorpus) return false;

  if (searchCorpus.includes(normalizedQuery)) return true;

  const tokens = tokenizeSearchQuery(normalizedQuery);
  if (!tokens.length) {
    return searchCorpus.includes(normalizedQuery);
  }

  return tokens.every((token) => searchCorpus.includes(token));
}

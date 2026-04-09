export type JsonObject = Record<string, unknown>;

export function emptyTipTapDoc(): JsonObject {
  return { type: 'doc', content: [] };
}

export function normalizeStoredArticleContent(raw: unknown): JsonObject {
  if (raw == null) return emptyTipTapDoc();
  if (typeof raw === 'object' && !Array.isArray(raw) && (raw as JsonObject).type === 'doc') {
    return raw as JsonObject;
  }
  return emptyTipTapDoc();
}

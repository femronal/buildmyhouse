/**
 * Normalizes stored CMS article body: TipTap JSON doc or legacy blocks[] from older rows.
 */

export type JsonObject = Record<string, unknown>;

export function emptyTipTapDoc(): JsonObject {
  return { type: 'doc', content: [] };
}

function textNode(text: string, marks?: JsonObject[]): JsonObject {
  const node: JsonObject = { type: 'text', text: String(text || '') };
  if (marks?.length) node.marks = marks;
  return node;
}

function paragraphFromText(text: string): JsonObject {
  return {
    type: 'paragraph',
    content: text.trim() ? [textNode(text)] : [],
  };
}

/** Convert pre-TipTap block array to ProseMirror-compatible doc.content nodes. */
export function legacyBlocksToTipTapNodes(blocks: unknown[]): JsonObject[] {
  const out: JsonObject[] = [];
  if (!Array.isArray(blocks)) return out;

  for (const block of blocks) {
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue;
    const b = block as Record<string, unknown>;
    const type = String(b.type || '');

    switch (type) {
      case 'heading':
        out.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [textNode(String(b.text || ''))],
        });
        break;
      case 'paragraph':
        out.push(paragraphFromText(String(b.text || '')));
        break;
      case 'bullets': {
        const items = Array.isArray(b.items) ? b.items : [];
        out.push({
          type: 'bulletList',
          content: items.map((item: unknown) => ({
            type: 'listItem',
            content: [paragraphFromText(String(item))],
          })),
        });
        break;
      }
      case 'quote':
        out.push({
          type: 'blockquote',
          content: [
            paragraphFromText(String(b.text || '')),
            ...(b.author
              ? [
                  {
                    type: 'paragraph',
                    content: [textNode(`— ${String(b.author)}`, [{ type: 'italic' }])],
                  },
                ]
              : []),
          ],
        });
        break;
      case 'image':
        out.push({
          type: 'image',
          attrs: {
            src: String(b.src || ''),
            alt: String(b.alt || ''),
            title: String(b.caption || ''),
          },
        });
        break;
      case 'youtube':
        out.push({
          type: 'youtube',
          attrs: { src: `https://www.youtube.com/watch?v=${String(b.videoId || '')}` },
        });
        break;
      case 'cta': {
        const label = String(b.label || 'Learn more');
        const href = String(b.href || '/');
        out.push({
          type: 'paragraph',
          content: [textNode(label, [{ type: 'link', attrs: { href, target: '_blank' } }])],
        });
        if (b.note) {
          out.push(paragraphFromText(String(b.note)));
        }
        break;
      }
      default:
        break;
    }
  }
  return out;
}

export function normalizeStoredArticleContent(raw: unknown): JsonObject {
  if (raw == null) return emptyTipTapDoc();

  if (typeof raw === 'object' && !Array.isArray(raw) && (raw as JsonObject).type === 'doc') {
    return raw as JsonObject;
  }

  if (Array.isArray(raw)) {
    return { type: 'doc', content: legacyBlocksToTipTapNodes(raw) };
  }

  return emptyTipTapDoc();
}

export function isTipTapDoc(value: unknown): value is JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as JsonObject).type === 'doc'
  );
}

function walkNodes(node: unknown, visit: (n: JsonObject) => void) {
  if (!node || typeof node !== 'object') return;
  const n = node as JsonObject;
  visit(n);
  const content = n.content;
  if (Array.isArray(content)) {
    for (const child of content) walkNodes(child, visit);
  }
}

/** Collect YouTube video IDs from a TipTap doc (for JSON-LD). */
export function extractYoutubeVideoIdsFromContent(doc: unknown): { videoId: string; title: string }[] {
  const results: { videoId: string; title: string }[] = [];
  const docObj = normalizeStoredArticleContent(doc);
  walkNodes(docObj, (n) => {
    if (n.type !== 'youtube') return;
    const src = String((n.attrs as JsonObject)?.src || '');
    const m = src.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    const videoId = m ? m[1] : '';
    if (videoId) {
      results.push({
        videoId,
        title: String((n.attrs as JsonObject)?.title || 'Video'),
      });
    }
  });
  return results;
}

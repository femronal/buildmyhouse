import type { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { ArticleCallout } from './tiptap-callout';
import type { JsonObject } from './article-content-normalize';

export function getArticleTiptapExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'bmx-article-link' },
    }),
    Image.configure({
      HTMLAttributes: { class: 'bmx-article-image' },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Youtube.configure({
      controls: true,
      nocookie: true,
      HTMLAttributes: { class: 'bmx-youtube-embed' },
    }),
    ArticleCallout,
  ];
}

export function articleContentToHtml(doc: JsonObject | null | undefined): string {
  const d = doc && typeof doc === 'object' ? doc : { type: 'doc', content: [] };
  try {
    return generateHTML(d as JSONContent, getArticleTiptapExtensions());
  } catch {
    return '';
  }
}

export const articleBodyStyles = `
:root { color: #1f2937; }
body { margin: 0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 18px; line-height: 1.7; }
h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin: 1.5rem 0 0.75rem; color: #111; }
h2 { font-size: 1.5rem; font-weight: 700; line-height: 1.25; margin: 2rem 0 0.5rem; color: #111; }
h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #111; }
p { margin: 0 0 1.25rem; }
ul, ol { margin: 0 0 1.25rem; padding-left: 1.5rem; }
li { margin: 0.35rem 0; }
blockquote { border-left: 4px solid #2563eb; margin: 1.5rem 0; padding: 0.5rem 0 0.5rem 1.25rem; color: #374151; font-style: italic; background: #f9fafb; border-radius: 0 0.5rem 0.5rem 0; }
pre { background: #111827; color: #f9fafb; border-radius: 0.75rem; padding: 1rem; overflow-x: auto; font-size: 0.9rem; margin: 1.25rem 0; }
code { background: #f3f4f6; padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-size: 0.9em; }
pre code { background: transparent; padding: 0; }
hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
img.bmx-article-image { width: 100%; max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; display: block; }
.bmx-youtube-embed { margin: 1.5rem 0; border-radius: 0.75rem; overflow: hidden; aspect-ratio: 16/9; }
.bmx-youtube-embed iframe { width: 100%; height: 100%; border: 0; }
aside.bmx-callout { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.75rem; padding: 1rem 1.25rem; margin: 1.5rem 0; }
.bmx-article-link { color: #2563eb; }
`;

export function wrapArticleHtmlFragment(fragment: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${articleBodyStyles}</style></head><body>${fragment}</body></html>`;
}

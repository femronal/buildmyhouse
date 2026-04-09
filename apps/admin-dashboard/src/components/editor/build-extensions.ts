import { type Extensions } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { Callout } from './extensions/callout';
import { SlashCommandExtension } from './slash-command';

export function buildArticleEditorExtensions(options?: {
  placeholder?: string;
  uploadImage?: (file: File) => Promise<string>;
}): Extensions {
  const placeholder = options?.placeholder ?? 'Start writing…';

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
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
    Callout,
    Placeholder.configure({
      placeholder,
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
    }),
    SlashCommandExtension(),
  ];
}

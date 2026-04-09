import { mergeAttributes, Node } from '@tiptap/core';

/** Must match admin-dashboard Callout extension (HTML output). */
export const ArticleCallout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'aside[data-bmx-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, {
        'data-bmx-callout': '',
        class: 'bmx-callout',
      }),
      0,
    ];
  },
});

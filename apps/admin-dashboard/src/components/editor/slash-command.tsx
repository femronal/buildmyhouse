'use client';

import { type Editor, Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';

export type SlashItem = {
  title: string;
  description: string;
  command: (p: { editor: Editor; range: { from: number; to: number } }) => void;
};

function filterItems(query: string): SlashItem[] {
  const q = query.toLowerCase();
  const all: SlashItem[] = [
    {
      title: 'Heading 1',
      description: 'Large section heading',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Bullet list',
      description: 'Unordered list',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered list',
      description: 'Ordered list',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Divider',
      description: 'Horizontal rule',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: 'Code block',
      description: 'Code snippet',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: 'Callout',
      description: 'Highlighted note box',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'callout',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Important: ' }],
              },
            ],
          })
          .run();
      },
    },
    {
      title: 'Image',
      description: 'From URL',
      command: ({ editor, range }) => {
        const url = window.prompt('Image URL');
        if (!url) return;
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      },
    },
    {
      title: 'YouTube',
      description: 'Embed video',
      command: ({ editor, range }) => {
        const url = window.prompt('YouTube URL');
        if (!url) return;
        editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: url }).run();
      },
    },
  ];
  if (!q) return all;
  return all.filter(
    (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
  );
}

type ListProps = {
  items: SlashItem[];
  editor: Editor;
  range: { from: number; to: number };
  /** TipTap Suggestion command — invoke with selected slash item as `props`. */
  suggestionCommand: (p: { editor: Editor; range: { from: number; to: number }; props: SlashItem }) => void;
};

export type SlashListRef = {
  onKeyDown: (e: KeyboardEvent) => boolean;
};

export const SlashCommandList = forwardRef<SlashListRef, ListProps>(function SlashCommandList(
  { items, editor, range, suggestionCommand },
  ref,
) {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setSelected(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowUp') {
        setSelected((s) => (s + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selected];
        if (item) suggestionCommand({ editor, range, props: item });
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return <div className="p-2 text-sm text-gray-500">No matches</div>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white py-1 shadow-lg min-w-[240px] max-h-72 overflow-y-auto">
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          className={`w-full text-left px-3 py-2 text-sm ${
            index === selected ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
          onMouseDown={(event) => {
            event.preventDefault();
            suggestionCommand({ editor, range, props: item });
          }}
        >
          <div className="font-medium text-gray-900">{item.title}</div>
          <div className="text-xs text-gray-500">{item.description}</div>
        </button>
      ))}
    </div>
  );
});

export function SlashCommandExtension() {
  return Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
      const suggestion: Partial<SuggestionOptions> = {
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const start = $from.start();
          const text = state.doc.textBetween(start, range.from, '\0', '\0');
          return text === '' || /\s$/.test(text.slice(-1));
        },
        items: ({ query }) => filterItems(query),
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        render: () => {
          let component: ReactRenderer<SlashListRef> | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: props.items,
                  editor: props.editor,
                  range: props.range,
                  suggestionCommand: props.command,
                },
                editor: props.editor,
              });
              if (!props.clientRect) return;
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate(props) {
              component?.updateProps({
                items: props.items,
                editor: props.editor,
                range: props.range,
                suggestionCommand: props.command,
              });
              if (!props.clientRect) return;
              popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
            },
            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              return component?.ref?.onKeyDown?.(props.event) ?? false;
            },
            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      };

      return [Suggestion(suggestion as SuggestionOptions)];
    },
  });
}

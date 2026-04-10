'use client';

import type { JSONContent } from '@tiptap/core';
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  StickyNote,
  Underline as UnderlineIcon,
  Youtube,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { buildArticleEditorExtensions } from './build-extensions';
import 'tippy.js/dist/tippy.css';

export type ArticleEditorProps = {
  value: Record<string, unknown> | null;
  onChange: (doc: Record<string, unknown>) => void;
  placeholder?: string;
  onUploadImage?: (file: File) => Promise<string>;
  showToolbar?: boolean;
};

const emptyDoc: JSONContent = { type: 'doc', content: [] };

export default function ArticleEditor({
  value,
  onChange,
  placeholder,
  onUploadImage,
  showToolbar = false,
}: ArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildArticleEditorExtensions({
      placeholder,
      uploadImage: onUploadImage,
    }),
    content:
      value && typeof value === 'object' && (value as { type?: string }).type === 'doc'
        ? (value as JSONContent)
        : emptyDoc,
    editorProps: {
      attributes: {
        class:
          'bmx-prose focus:outline-none min-h-[420px] max-w-none px-1 py-2 text-lg leading-relaxed text-gray-900',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as Record<string, unknown>);
    },
  });

  useEffect(() => {
    if (!editor || !value) return;
    if (typeof value !== 'object' || (value as { type?: string }).type !== 'doc') return;
    const cur = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (cur !== next) {
      editor.commands.setContent(value as JSONContent, false);
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[420px] rounded-xl bg-gray-50 animate-pulse" aria-hidden />
    );
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImageByUrl = () => {
    const url = window.prompt('Image URL');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const addYoutube = () => {
    const url = window.prompt('YouTube URL');
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const onPickImageFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadImage) return;
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      window.alert('Image upload failed');
    }
  };

  const ToolbarBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded-md text-sm ${
        active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full relative">
      <div className="flex items-center gap-2 pb-2 mb-2">
        <button
          type="button"
          title="Insert image from URL"
          onClick={addImageByUrl}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        {onUploadImage ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickImageFile}
            />
            <button
              type="button"
              title="Upload image"
              onClick={() => fileInputRef.current?.click()}
              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <span className="text-[10px] font-semibold">Up</span>
            </button>
          </>
        ) : null}
        <button
          type="button"
          title="Embed YouTube"
          onClick={addYoutube}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <Youtube className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Insert callout"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'callout',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Important: ' }],
                  },
                ],
              })
              .run()
          }
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <StickyNote className="w-3.5 h-3.5" />
        </button>
        <p className="text-xs text-gray-400 ml-1">
          Type <kbd className="px-1 rounded bg-gray-100">/</kbd> for commands
        </p>
      </div>

      {showToolbar ? (
      <div className="flex flex-wrap items-center gap-1 pb-3 border-b border-gray-100 mb-2">
        <ToolbarBtn
          title="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>
        <span className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarBtn
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="w-4 h-4" />
        </ToolbarBtn>
        <span className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarBtn
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <span className="text-xs font-serif font-bold">&ldquo;</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Code block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <span className="text-[10px] font-mono">{`{ }`}</span>
        </ToolbarBtn>
        <span className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarBtn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Image from URL" onClick={addImageByUrl}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn title="YouTube" onClick={addYoutube}>
          <Youtube className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Callout"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'callout',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Important: ' }],
                  },
                ],
              })
              .run()
          }
        >
          <StickyNote className="w-4 h-4" />
        </ToolbarBtn>
      </div>
      ) : null}

      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 120, placement: 'top' }}
        className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
      >
        <ToolbarBtn
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="H1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <span className="text-xs font-bold">H1</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="H2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="H3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <span className="text-xs font-serif font-bold">&ldquo;</span>
        </ToolbarBtn>
        <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Bullets"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbers"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
      </BubbleMenu>

      <EditorContent editor={editor} />

      <p className="mt-3 text-xs text-gray-400">
        Highlight text to format (bubble menu), or type <kbd className="px-1 rounded bg-gray-100">/</kbd> to insert blocks.
      </p>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Globe, UploadCloud } from 'lucide-react';
import ArticleEditor from '@/components/editor/ArticleEditor';
import { api } from '@/lib/api';
import {
  useCmsArticles,
  type CmsArticle,
  type CmsArticleAudience,
  type UpsertCmsArticlePayload,
} from '@/hooks/useCmsArticles';

type FormState = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  readingMinutes: string;
  tagsCsv: string;
  authorName: string;
  canonicalPath: string;
  audience: CmsArticleAudience;
  contentDoc: Record<string, unknown>;
  faqsJson: string;
  internalLinksJson: string;
  isPublished: boolean;
};

const emptyTipTapDoc = (): Record<string, unknown> => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
});

function emptyForm(audience: CmsArticleAudience): FormState {
  return {
    slug: '',
    title: '',
    description: '',
    excerpt: '',
    coverImageUrl: '',
    coverImageAlt: '',
    readingMinutes: '6',
    tagsCsv: '',
    authorName: 'BuildMyHouse Editorial',
    canonicalPath: '',
    audience,
    contentDoc: emptyTipTapDoc(),
    faqsJson: JSON.stringify(
      [{ question: 'Sample question?', answer: 'Sample answer.' }],
      null,
      2,
    ),
    internalLinksJson: JSON.stringify(
      [{ label: 'Construction in Nigeria', href: '/construction/nigeria' }],
      null,
      2,
    ),
    isPublished: false,
  };
}

function toFormState(article: CmsArticle): FormState {
  const c = article.content;
  const contentDoc =
    c && typeof c === 'object' && !Array.isArray(c) && (c as { type?: string }).type === 'doc'
      ? (c as Record<string, unknown>)
      : emptyTipTapDoc();

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    excerpt: article.excerpt,
    coverImageUrl: article.coverImageUrl,
    coverImageAlt: article.coverImageAlt,
    readingMinutes: String(article.readingMinutes || 6),
    tagsCsv: (article.tags || []).join(', '),
    authorName: article.authorName || 'BuildMyHouse Editorial',
    canonicalPath: article.canonicalPath || `/articles/${article.slug}`,
    audience: article.audience || 'homeowner',
    contentDoc,
    faqsJson: JSON.stringify(article.faqs || [], null, 2),
    internalLinksJson: JSON.stringify(article.internalLinks || [], null, 2),
    isPublished: Boolean(article.isPublished),
  };
}

export default function ArticleEditorPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') || '';
  const initialAudience =
    params.get('audience') === 'gc' ? 'gc' : 'homeowner';

  const { articles, createArticle, updateArticle, isSaving } = useCmsArticles();
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(initialAudience));

  const editingArticle = useMemo(
    () => (id ? articles.find((a) => a.id === id) || null : null),
    [articles, id],
  );

  useEffect(() => {
    if (!id) {
      setForm((prev) => ({ ...emptyForm(initialAudience), audience: prev.audience || initialAudience }));
      return;
    }
    if (editingArticle) {
      setForm(toFormState(editingArticle));
    }
  }, [id, editingArticle, initialAudience]);

  const parseJsonField = (label: string, raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in ${label}`);
    }
  };

  const buildPayload = (): UpsertCmsArticlePayload => {
    if (!form.slug.trim()) throw new Error('Slug is required');
    if (!form.title.trim()) throw new Error('Title is required');
    if (!form.description.trim()) throw new Error('Description is required');
    if (!form.excerpt.trim()) throw new Error('Excerpt is required');
    if (!form.coverImageUrl.trim()) throw new Error('Cover image URL is required');
    if (!form.coverImageAlt.trim()) throw new Error('Cover image alt text is required');

    const readingMinutes = Number(form.readingMinutes);
    if (!Number.isFinite(readingMinutes) || readingMinutes < 1) {
      throw new Error('Reading minutes must be at least 1');
    }

    const content = form.contentDoc;
    if (
      !content ||
      typeof content !== 'object' ||
      Array.isArray(content) ||
      (content as { type?: string }).type !== 'doc'
    ) {
      throw new Error('Article body must be a valid editor document');
    }
    const inner = (content as { content?: unknown }).content;
    if (!Array.isArray(inner) || inner.length === 0) {
      throw new Error('Add at least one block of content in the editor');
    }

    const faqs = parseJsonField('faqs', form.faqsJson);
    const internalLinks = parseJsonField('internal links', form.internalLinksJson);
    if (!Array.isArray(faqs)) throw new Error('FAQs JSON must be an array');
    if (!Array.isArray(internalLinks)) throw new Error('Internal links JSON must be an array');

    const canonicalPath = form.canonicalPath.trim() || `/articles/${form.slug.trim()}`;

    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      excerpt: form.excerpt.trim(),
      coverImageUrl: form.coverImageUrl.trim(),
      coverImageAlt: form.coverImageAlt.trim(),
      readingMinutes,
      tags: form.tagsCsv
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      authorName: form.authorName.trim() || 'BuildMyHouse Editorial',
      canonicalPath,
      audience: form.audience,
      content,
      faqs,
      internalLinks,
      isPublished: form.isPublished,
    };
  };

  const onUploadCover: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    try {
      setUploadingCover(true);
      const result = await api.uploadFile(file);
      setForm((prev) => ({ ...prev, coverImageUrl: result.url }));
    } catch (error: any) {
      setFormError(error?.message || 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setFormError(null);
    try {
      const payload = buildPayload();
      if (editingArticle) {
        await updateArticle({ id: editingArticle.id, payload });
      } else {
        await createArticle(payload);
      }
      router.push('/articles');
    } catch (error: any) {
      setFormError(error?.message || 'Failed to save article');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <form onSubmit={onSubmit} className="px-8 py-6">
        <div className="max-w-[980px] mx-auto">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/articles"
                className="w-9 h-9 rounded-full border border-gray-200 inline-flex items-center justify-center text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">
                  {editingArticle ? 'Edit draft' : 'New draft'}
                </h1>
                <p className="text-xs text-gray-500">Medium-style writing canvas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, audience: 'homeowner' }))}
                className={`px-3 py-1.5 text-xs rounded-full border ${
                  form.audience === 'homeowner'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Homeowner mode
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, audience: 'gc' }))}
                className={`px-3 py-1.5 text-xs rounded-full border ${
                  form.audience === 'gc'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                GC mode
              </button>
            </div>
          </div>

          {formError ? (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>
          ) : null}

          <div className="max-w-[760px] mx-auto space-y-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Title"
              className="w-full border-0 text-5xl font-bold leading-tight px-0 py-1 focus:outline-none focus:ring-0 placeholder:text-gray-300"
              required
            />

            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Add a subtitle that explains what readers will learn..."
              className="w-full border-0 text-xl text-gray-600 px-0 py-1 resize-none focus:outline-none focus:ring-0 placeholder:text-gray-300"
              required
            />

            <div className="flex items-center gap-2">
              <label className="px-3 py-2 rounded-full border border-gray-300 text-sm cursor-pointer inline-flex items-center gap-2 hover:bg-gray-50">
                <UploadCloud className="w-4 h-4" />
                {uploadingCover ? 'Uploading...' : 'Upload cover image'}
                <input type="file" accept="image/*" className="hidden" onChange={onUploadCover} />
              </label>
              {form.coverImageUrl ? (
                <a
                  href={form.coverImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Preview image URL
                </a>
              ) : null}
            </div>

            {form.coverImageUrl ? (
              <img
                src={form.coverImageUrl}
                alt={form.coverImageAlt || 'Cover preview'}
                className="w-full rounded-2xl border border-gray-200 max-h-[320px] object-cover"
              />
            ) : null}

            <div className="pt-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Article body *</label>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <ArticleEditor
                  value={form.contentDoc}
                  onChange={(doc) => setForm((prev) => ({ ...prev, contentDoc: doc }))}
                  placeholder="Tell your story..."
                  onUploadImage={async (file) => {
                    const result = await api.uploadFile(file);
                    return result.url;
                  }}
                />
              </div>
            </div>

            <details className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                Publishing & SEO settings
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="cost-to-build-house-in-nigeria-2026"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Canonical path *</label>
                    <input
                      type="text"
                      value={form.canonicalPath}
                      onChange={(e) => setForm((prev) => ({ ...prev, canonicalPath: e.target.value }))}
                      placeholder="/articles/cost-to-build-house-in-nigeria-2026"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt *</label>
                    <textarea
                      rows={3}
                      value={form.excerpt}
                      onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cover image URL *</label>
                      <input
                        type="text"
                        value={form.coverImageUrl}
                        onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cover alt text *</label>
                      <input
                        type="text"
                        value={form.coverImageAlt}
                        onChange={(e) => setForm((prev) => ({ ...prev, coverImageAlt: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reading minutes *</label>
                    <input
                      type="number"
                      min={1}
                      value={form.readingMinutes}
                      onChange={(e) => setForm((prev) => ({ ...prev, readingMinutes: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={form.tagsCsv}
                      onChange={(e) => setForm((prev) => ({ ...prev, tagsCsv: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="construction, nigeria, cost guide"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author name</label>
                    <input
                      type="text"
                      value={form.authorName}
                      onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FAQs JSON *</label>
                    <textarea
                      rows={10}
                      value={form.faqsJson}
                      onChange={(e) => setForm((prev) => ({ ...prev, faqsJson: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal links JSON *</label>
                    <textarea
                      rows={10}
                      value={form.internalLinksJson}
                      onChange={(e) => setForm((prev) => ({ ...prev, internalLinksJson: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="sticky bottom-0 mt-6 bg-white/95 backdrop-blur border-t pt-4">
            <div className="max-w-[760px] mx-auto flex items-center justify-between">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>
              <div className="flex justify-end gap-2">
                <Link
                  href="/articles"
                  className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving || uploadingCover}
                  className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingArticle ? 'Update article' : 'Create article'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

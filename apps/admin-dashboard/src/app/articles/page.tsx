'use client';

import { useMemo, useState } from 'react';
import { FilePenLine, Globe, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useCmsArticles, type UpsertCmsArticlePayload, type CmsArticle } from '@/hooks/useCmsArticles';

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
  blocksJson: string;
  faqsJson: string;
  internalLinksJson: string;
  isPublished: boolean;
};

function emptyForm(): FormState {
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
    blocksJson: JSON.stringify(
      [{ type: 'paragraph', text: 'Add your opening paragraph here.' }],
      null,
      2,
    ),
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
    blocksJson: JSON.stringify(article.blocks || [], null, 2),
    faqsJson: JSON.stringify(article.faqs || [], null, 2),
    internalLinksJson: JSON.stringify(article.internalLinks || [], null, 2),
    isPublished: Boolean(article.isPublished),
  };
}

export default function ArticlesAdminPage() {
  const {
    articles,
    isLoading,
    createArticle,
    updateArticle,
    deleteArticle,
    publishArticle,
    isSaving,
    isDeleting,
  } = useCmsArticles();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<CmsArticle | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const sortedArticles = useMemo(
    () =>
      [...articles].sort(
        (a, b) =>
          Number(new Date(b.publishedAt || b.updatedAt)) -
          Number(new Date(a.publishedAt || a.updatedAt)),
      ),
    [articles],
  );

  const openCreateModal = () => {
    setEditingArticle(null);
    setForm(emptyForm());
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (article: CmsArticle) => {
    setEditingArticle(article);
    setForm(toFormState(article));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    setForm(emptyForm());
    setFormError(null);
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

    const blocks = parseJsonField('blocks', form.blocksJson);
    const faqs = parseJsonField('faqs', form.faqsJson);
    const internalLinks = parseJsonField('internal links', form.internalLinksJson);

    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new Error('Blocks JSON must be a non-empty array');
    }
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (!block || typeof block !== 'object' || Array.isArray(block)) {
        throw new Error(`Block ${i + 1} must be a JSON object`);
      }
      if (typeof block.type !== 'string' || !block.type.trim()) {
        throw new Error(`Block ${i + 1} must include a "type" field`);
      }
    }
    if (!Array.isArray(faqs)) {
      throw new Error('FAQs JSON must be an array');
    }
    if (!Array.isArray(internalLinks)) {
      throw new Error('Internal links JSON must be an array');
    }

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
      blocks,
      faqs,
      internalLinks,
      isPublished: form.isPublished,
    };
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
      closeModal();
    } catch (error: any) {
      setFormError(error?.message || 'Failed to save article');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Content Articles</h1>
          <p className="text-gray-500 mt-1">
            Create, update, and publish SEO content for the homeowner web app.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New article
        </button>
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">All articles</h2>
          <span className="text-xs text-gray-400">{sortedArticles.length} total</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading articles...</div>
        ) : sortedArticles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No articles yet. Create your first article.
          </div>
        ) : (
          <div className="divide-y">
            {sortedArticles.map((article) => (
              <div key={article.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{article.title}</h3>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        article.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {article.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{article.canonicalPath}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Updated {new Date(article.updatedAt).toLocaleString()}
                    {article.publishedAt
                      ? ` • Published ${new Date(article.publishedAt).toLocaleString()}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => publishArticle({ id: article.id, isPublished: !article.isPublished })}
                    className={`px-3 py-1.5 text-xs rounded-md border ${
                      article.isPublished
                        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {article.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(article)}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <FilePenLine className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `Delete "${article.title}"? This action cannot be undone.`,
                      );
                      if (!confirmed) return;
                      await deleteArticle(article.id);
                    }}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingArticle ? 'Edit article' : 'Create article'}
              </h3>
              <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4">
              {formError ? (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>
              ) : null}

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex items-center gap-2">
                <label className="px-3 py-2 rounded-lg border border-gray-300 text-sm cursor-pointer inline-flex items-center gap-2 hover:bg-gray-50">
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blocks JSON *</label>
                  <textarea
                    rows={14}
                    value={form.blocksJson}
                    onChange={(e) => setForm((prev) => ({ ...prev, blocksJson: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FAQs JSON *</label>
                  <textarea
                    rows={14}
                    value={form.faqsJson}
                    onChange={(e) => setForm((prev) => ({ ...prev, faqsJson: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal links JSON *</label>
                  <textarea
                    rows={14}
                    value={form.internalLinksJson}
                    onChange={(e) => setForm((prev) => ({ ...prev, internalLinksJson: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || uploadingCover}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingArticle ? 'Update article' : 'Create article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

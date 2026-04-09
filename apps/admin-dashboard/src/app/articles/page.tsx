'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FilePenLine, Plus, Trash2 } from 'lucide-react';
import {
  useCmsArticles,
  type CmsArticle,
  type CmsArticleAudience,
} from '@/hooks/useCmsArticles';

const AUDIENCE_OPTIONS: { value: CmsArticleAudience; label: string; hint: string }[] = [
  { value: 'homeowner', label: 'Homeowner', hint: 'buildmyhouse.app/articles' },
  { value: 'gc', label: 'General Contractor', hint: 'gc.buildmyhouse.app/articles' },
];

export default function ArticlesAdminPage() {
  const [audience, setAudience] = useState<CmsArticleAudience>('homeowner');
  const {
    articles,
    isLoading,
    deleteArticle,
    publishArticle,
    isDeleting,
  } = useCmsArticles(audience);

  const sortedArticles = useMemo(
    () =>
      [...articles].sort(
        (a, b) =>
          Number(new Date(b.publishedAt || b.updatedAt)) -
          Number(new Date(a.publishedAt || a.updatedAt)),
      ),
    [articles],
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Content Articles</h1>
          <p className="text-gray-500 mt-1">
            Medium-style publishing for homeowner and GC domains.
          </p>
        </div>
        <Link
          href={`/articles/editor?audience=${audience}`}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New article
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AUDIENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setAudience(opt.value)}
            className={`rounded-xl border p-4 text-left transition ${
              audience === opt.value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-semibold">{opt.label} Articles</div>
            <div className={`text-xs mt-1 ${audience === opt.value ? 'text-white/80' : 'text-gray-500'}`}>
              {opt.hint}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {audience === 'homeowner' ? 'Homeowner' : 'GC'} article stream
          </h2>
          <span className="text-xs text-gray-400">{sortedArticles.length} total</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading articles...</div>
        ) : sortedArticles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No articles yet for this audience.
          </div>
        ) : (
          <div className="divide-y">
            {sortedArticles.map((article: CmsArticle) => (
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
                    onClick={() =>
                      publishArticle({ id: article.id, isPublished: !article.isPublished })
                    }
                    className={`px-3 py-1.5 text-xs rounded-md border ${
                      article.isPublished
                        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {article.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link
                    href={`/articles/editor?id=${article.id}&audience=${article.audience}`}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <FilePenLine className="w-3.5 h-3.5" />
                    Edit
                  </Link>
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
    </div>
  );
}

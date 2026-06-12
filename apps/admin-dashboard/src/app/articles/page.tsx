'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, Copy, FilePenLine, Layers3, Plus, Trash2 } from 'lucide-react';
import {
  useCmsArticles,
  type CmsArticle,
  type CmsArticleAudience,
} from '@/hooks/useCmsArticles';
import { useResourceSections } from '@/hooks/useResourceSections';

const AUDIENCE_OPTIONS: { value: CmsArticleAudience; label: string; hint: string }[] = [
  { value: 'homeowner', label: 'Homeowner', hint: 'buildmyhouse.app/articles' },
  { value: 'gc', label: 'General Contractor', hint: 'gc.buildmyhouse.app/articles' },
];

const HOMEOWNER_WEB_URL = 'https://buildmyhouse.app';
const GC_WEB_URL = 'https://gc.buildmyhouse.app';

function getPublicArticleUrl(article: CmsArticle) {
  const baseUrl = article.audience === 'gc' ? GC_WEB_URL : HOMEOWNER_WEB_URL;
  const cleanPath = article.canonicalPath.startsWith('/')
    ? article.canonicalPath
    : `/${article.canonicalPath}`;
  return `${baseUrl}${cleanPath}`;
}

async function copyToClipboard(text: string) {
  if (typeof window === 'undefined') return;

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default function ArticlesAdminPage() {
  const [audience, setAudience] = useState<CmsArticleAudience>('homeowner');
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const {
    articles,
    isLoading,
    deleteArticle,
    publishArticle,
    isDeleting,
  } = useCmsArticles(audience);
  const { sections } = useResourceSections();

  const sectionLabelByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of sections) {
      map.set(section.key, section.label);
    }
    return map;
  }, [sections]);

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
        <div className="flex items-center gap-2">
          <Link
            href="/articles/sections"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm flex items-center gap-2 hover:bg-gray-50"
          >
            <Layers3 className="w-4 h-4" />
            Manage sections
          </Link>
          <Link
            href={`/articles/editor?audience=${audience}`}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New article
          </Link>
        </div>
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
                <div className="min-w-0 flex-1">
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
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <a
                      href={getPublicArticleUrl(article)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-500 hover:text-gray-700 hover:underline break-all"
                    >
                      {article.canonicalPath}
                    </a>
                    {article.isPublished ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await copyToClipboard(getPublicArticleUrl(article));
                          setCopiedArticleId(article.id);
                          window.setTimeout(() => {
                            setCopiedArticleId((prev) => (prev === article.id ? null : prev));
                          }, 1800);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border ${
                          copiedArticleId === article.id
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {copiedArticleId === article.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy link
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
                  {audience === 'homeowner' && article.resourceSectionKeys?.length ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {article.resourceSectionKeys.map((key) => (
                        <span
                          key={key}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                        >
                          {sectionLabelByKey.get(key) || key}
                        </span>
                      ))}
                    </div>
                  ) : null}
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

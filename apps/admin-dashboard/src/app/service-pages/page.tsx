'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, Copy, FilePenLine, Plus, Trash2, Wrench } from 'lucide-react';
import {
  useCmsServicePages,
  type CmsServicePage,
  type ServicePageRegion,
} from '@/hooks/useCmsServicePages';

const REGION_OPTIONS: { value: ServicePageRegion; label: string; hint: string }[] = [
  { value: 'lagos', label: 'Lagos service pages', hint: 'buildmyhouse.app/services/lagos/*' },
  { value: 'nigeria', label: 'Nigeria service pages', hint: 'buildmyhouse.app/services/*-nigeria' },
];

const WEB_URL = 'https://buildmyhouse.app';

function getPublicServicePageUrl(page: CmsServicePage) {
  return `${WEB_URL}${page.canonicalPath.startsWith('/') ? page.canonicalPath : `/${page.canonicalPath}`}`;
}

async function copyToClipboard(text: string) {
  if (typeof window === 'undefined') return;
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default function ServicePagesAdminPage() {
  const [region, setRegion] = useState<ServicePageRegion>('lagos');
  const [copiedPageId, setCopiedPageId] = useState<string | null>(null);
  const { pages, isLoading, deletePage, publishPage, isDeleting } = useCmsServicePages(region);

  const sortedPages = useMemo(
    () =>
      [...pages].sort(
        (a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)),
      ),
    [pages],
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Service Pages</h1>
          <p className="text-gray-500 mt-1">
            Manage Lagos and Nigeria repair service landing pages — copy, images, and SEO.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/articles"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm hover:bg-gray-50"
          >
            Content articles
          </Link>
          <Link
            href={`/service-pages/editor?region=${region}`}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New service page
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REGION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRegion(opt.value)}
            className={`rounded-xl border p-4 text-left transition ${
              region === opt.value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              {opt.label}
            </div>
            <div className={`text-xs mt-1 ${region === opt.value ? 'text-white/80' : 'text-gray-500'}`}>
              {opt.hint}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {region === 'lagos' ? 'Lagos' : 'Nigeria'} service page stream
          </h2>
          <span className="text-xs text-gray-400">{sortedPages.length} total</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading service pages...</div>
        ) : sortedPages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No CMS service pages yet. Static bundled pages still work until you publish a CMS override.
          </div>
        ) : (
          <div className="divide-y">
            {sortedPages.map((page) => (
              <div key={page.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{page.payload.headline}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {page.templateKind}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        page.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {page.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <a
                      href={getPublicServicePageUrl(page)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-500 hover:text-gray-700 hover:underline break-all"
                    >
                      {page.canonicalPath}
                    </a>
                    {page.isPublished ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await copyToClipboard(getPublicServicePageUrl(page));
                          setCopiedPageId(page.id);
                          window.setTimeout(() => {
                            setCopiedPageId((prev) => (prev === page.id ? null : prev));
                          }, 1800);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border ${
                          copiedPageId === page.id
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {copiedPageId === page.id ? (
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
                  <p className="text-sm text-gray-600 line-clamp-2">{page.summary}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Updated {new Date(page.updatedAt).toLocaleString()}
                    {page.publishedAt
                      ? ` • Published ${new Date(page.publishedAt).toLocaleString()}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      publishPage({ id: page.id, isPublished: !page.isPublished })
                    }
                    className={`px-3 py-1.5 text-xs rounded-md border ${
                      page.isPublished
                        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {page.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link
                    href={`/service-pages/editor?id=${page.id}&region=${page.region}`}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <FilePenLine className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `Delete "${page.payload.headline}"? This action cannot be undone.`,
                      );
                      if (!confirmed) return;
                      await deletePage(page.id);
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

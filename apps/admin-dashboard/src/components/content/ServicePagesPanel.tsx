'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, Copy, FilePenLine, Plus, Trash2, Wrench } from 'lucide-react';
import {
  useCmsServicePages,
  type CmsServicePage,
  type ServicePageRegion,
} from '@/hooks/useCmsServicePages';
import { getServicePageCatalog } from '@/lib/service-page-catalog';

const REGION_OPTIONS: { value: ServicePageRegion; label: string; hint: string }[] = [
  { value: 'lagos', label: 'Lagos service pages', hint: 'buildmyhouse.app/services/lagos/*' },
  { value: 'nigeria', label: 'Nigeria service pages', hint: 'buildmyhouse.app/services/*-nigeria' },
];

const WEB_URL = 'https://buildmyhouse.app';

function getPublicServicePageUrl(path: string) {
  return `${WEB_URL}${path.startsWith('/') ? path : `/${path}`}`;
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

type ServicePageRow = {
  slug: string;
  region: ServicePageRegion;
  templateKind: string;
  canonicalPath: string;
  label: string;
  summary: string;
  cms?: CmsServicePage;
  isCatalog: boolean;
};

function buildEditorHref(row: Pick<ServicePageRow, 'cms' | 'region' | 'templateKind' | 'slug'>) {
  if (row.cms) {
    return `/service-pages/editor?id=${row.cms.id}&region=${row.cms.region}`;
  }
  const params = new URLSearchParams({
    region: row.region,
    templateKind: row.templateKind,
    slug: row.slug,
  });
  return `/service-pages/editor?${params.toString()}`;
}

export default function ServicePagesPanel() {
  const [region, setRegion] = useState<ServicePageRegion>('lagos');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const { pages, isLoading, deletePage, publishPage, isDeleting } = useCmsServicePages(region);

  const rows = useMemo(() => {
    const catalog = getServicePageCatalog(region);
    const cmsByPath = new Map(pages.map((page) => [page.canonicalPath, page]));
    const catalogPaths = new Set<string>();

    const catalogRows: ServicePageRow[] = catalog.map((entry) => {
      catalogPaths.add(entry.canonicalPath);
      return {
        ...entry,
        cms: cmsByPath.get(entry.canonicalPath),
        isCatalog: true,
      };
    });

    const customRows: ServicePageRow[] = pages
      .filter((page) => !catalogPaths.has(page.canonicalPath))
      .map((page) => ({
        slug: page.slug,
        region: page.region,
        templateKind: page.templateKind,
        canonicalPath: page.canonicalPath,
        label: page.payload.headline || page.templateKind,
        summary: page.summary,
        cms: page,
        isCatalog: false,
      }));

    return [...catalogRows, ...customRows].sort((a, b) => a.label.localeCompare(b.label));
  }, [pages, region]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Link
          href={`/service-pages/editor?region=${region}`}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New service page
        </Link>
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
        <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">
              {region === 'lagos' ? 'Lagos' : 'Nigeria'} service pages
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Bundled pages are live by default. Customize any page to edit copy, photos, CTAs, and publish CMS overrides.
            </p>
          </div>
          <span className="text-xs text-gray-400">{rows.length} listed</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading service pages...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No service pages found for this region.</div>
        ) : (
          <div className="divide-y">
            {rows.map((row) => {
              const headline = row.cms?.payload.headline || row.label;
              const summary = row.cms?.summary || row.summary;
              const status = row.cms?.isPublished
                ? 'Published'
                : row.cms
                  ? 'Draft'
                  : 'Live (bundled)';
              const statusClass = row.cms?.isPublished
                ? 'bg-green-100 text-green-700'
                : row.cms
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-700';

              return (
                <div key={row.canonicalPath} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{headline}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {row.templateKind}
                      </span>
                      {!row.isCatalog ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          Custom
                        </span>
                      ) : null}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusClass}`}>{status}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <a
                        href={getPublicServicePageUrl(row.canonicalPath)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-500 hover:text-gray-700 hover:underline break-all"
                      >
                        {row.canonicalPath}
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          await copyToClipboard(getPublicServicePageUrl(row.canonicalPath));
                          setCopiedPath(row.canonicalPath);
                          window.setTimeout(() => {
                            setCopiedPath((prev) => (prev === row.canonicalPath ? null : prev));
                          }, 1800);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border ${
                          copiedPath === row.canonicalPath
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {copiedPath === row.canonicalPath ? (
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
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">{summary}</p>

                    {row.cms ? (
                      <p className="text-xs text-gray-400 mt-2">
                        Updated {new Date(row.cms.updatedAt).toLocaleString()}
                        {row.cms.publishedAt
                          ? ` • Published ${new Date(row.cms.publishedAt).toLocaleString()}`
                          : ''}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {row.cms ? (
                      <button
                        type="button"
                        onClick={() =>
                          publishPage({ id: row.cms!.id, isPublished: !row.cms!.isPublished })
                        }
                        className={`px-3 py-1.5 text-xs rounded-md border ${
                          row.cms.isPublished
                            ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {row.cms.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    ) : null}
                    <Link
                      href={buildEditorHref(row)}
                      className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      <FilePenLine className="w-3.5 h-3.5" />
                      {row.cms ? 'Edit' : 'Customize'}
                    </Link>
                    {row.cms ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = window.confirm(
                            `Delete CMS override for "${headline}"? The bundled page will remain live.`,
                          );
                          if (!confirmed) return;
                          await deletePage(row.cms!.id);
                        }}
                        disabled={isDeleting}
                        className="px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

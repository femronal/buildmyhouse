'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Wrench } from 'lucide-react';
import {
  ADMIN_TOOL_CATEGORIES,
  ADMIN_TOOLS,
  type AdminTool,
  type AdminToolCategory,
} from '@/lib/admin-tools-catalog';

type FilterKey = AdminToolCategory | 'featured';

const CATEGORY_LABEL: Record<AdminToolCategory, string> = {
  'before-buying': 'Before buying',
  'hiring-budgeting': 'Hiring & budget',
  'remote-control': 'Remote control',
  'completion-disputes': 'Completion',
  'repairs-management': 'Repairs',
};

function ToolCard({ tool }: { tool: AdminTool }) {
  const live = tool.status === 'live' && Boolean(tool.adminHref);
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {CATEGORY_LABEL[tool.category]}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{tool.title}</h3>
        </div>
        {live ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            Live
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            <Clock className="h-3 w-3" />
            Coming soon
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-600">{tool.tagline}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        {live ? (
          <span className="inline-flex items-center gap-1 font-medium text-blue-700">
            {tool.opsLabel || 'Open ops'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="text-gray-400">Ops surface not available yet</span>
        )}
      </div>
    </>
  );

  if (live && tool.adminHref) {
    return (
      <Link
        href={tool.adminHref}
        className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 opacity-90 shadow-sm">
      {body}
    </div>
  );
}

export default function ToolsHubPage() {
  const [filter, setFilter] = useState<FilterKey>('featured');

  const activeCategory = ADMIN_TOOL_CATEGORIES.find((c) => c.key === filter);

  const tools = useMemo(() => {
    if (filter === 'featured') {
      return ADMIN_TOOLS.filter((t) => t.featured).sort(
        (a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99),
      );
    }
    return ADMIN_TOOLS.filter((t) => t.category === filter);
  }, [filter]);

  const liveCount = ADMIN_TOOLS.filter((t) => t.status === 'live').length;

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-gray-900 p-2 text-white">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            BuildMyHouse Tools
          </p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Check all tools</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Operations cockpit for customer-facing tools — land risk, quote fairness, repair
            triage, budgets, remote oversight, and property management. Open a live tool to run
            its admin workflows.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {liveCount} live · {ADMIN_TOOLS.length - liveCount} planned
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1 border-b border-gray-200">
        {ADMIN_TOOL_CATEGORIES.map((cat) => {
          const active = filter === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setFilter(cat.key)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      <p className="mb-5 text-sm text-gray-500">{activeCategory?.description}</p>

      {tools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No tools in this category yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}

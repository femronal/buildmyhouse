'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  useResourceSections,
  type CmsResourceSection,
  type UpsertResourceSectionPayload,
} from '@/hooks/useResourceSections';

type DraftSection = UpsertResourceSectionPayload & { id?: string };

function emptyDraft(): DraftSection {
  return {
    key: '',
    label: '',
    hint: '',
    sortOrder: 120,
    isActive: true,
  };
}

export default function ResourceSectionsAdminPage() {
  const {
    sections,
    isLoading,
    createSection,
    updateSection,
    deleteSection,
    isSaving,
    isDeleting,
  } = useResourceSections();
  const [draft, setDraft] = useState<DraftSection>(() => emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    [sections],
  );

  const startEdit = (section: CmsResourceSection) => {
    setEditingId(section.id);
    setDraft({
      id: section.id,
      key: section.key,
      label: section.label,
      hint: section.hint,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
    });
    setError(null);
  };

  const resetDraft = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload: UpsertResourceSectionPayload = {
        key: draft.key.trim(),
        label: draft.label.trim(),
        hint: draft.hint?.trim() || '',
        sortOrder: Number(draft.sortOrder || 0),
        isActive: draft.isActive !== false,
      };

      if (!payload.key || !payload.label) {
        throw new Error('Section key and label are required');
      }

      if (editingId) {
        await updateSection({ id: editingId, payload });
      } else {
        await createSection(payload);
      }
      resetDraft();
    } catch (err: any) {
      setError(err?.message || 'Failed to save section');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to articles
          </Link>
          <h1 className="text-3xl font-bold font-poppins">Articles Landing Page Sections</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            These sections power the left sidebar on buildmyhouse.app/articles. Assign sections when
            publishing articles so new content appears automatically under the right topic.
          </p>
        </div>
        <Link
          href="/articles/editor?audience=homeowner"
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New article
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-5 space-y-4 h-fit">
          <h2 className="text-lg font-semibold">
            {editingId ? 'Edit section' : 'Create new section'}
          </h2>
          {error ? <div className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</div> : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section key *</label>
            <input
              type="text"
              value={draft.key}
              onChange={(e) => setDraft((prev) => ({ ...prev, key: e.target.value }))}
              placeholder="cost-planning"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sidebar label *</label>
            <input
              type="text"
              value={draft.label}
              onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Cost planning"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short hint</label>
            <textarea
              rows={3}
              value={draft.hint}
              onChange={(e) => setDraft((prev) => ({ ...prev, hint: e.target.value }))}
              placeholder="Budget breakdowns, financing, and payment discipline"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
              <input
                type="number"
                min={0}
                value={draft.sortOrder ?? 0}
                onChange={(e) => setDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.isActive !== false}
                  onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active on landing page
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : editingId ? 'Update section' : 'Create section'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetDraft}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current sections</h2>
            <span className="text-xs text-gray-400">{sortedSections.length} total</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading sections…</div>
          ) : sortedSections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No sections yet.</div>
          ) : (
            <div className="divide-y">
              {sortedSections.map((section) => (
                <div key={section.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{section.label}</h3>
                      <code className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {section.key}
                      </code>
                      {section.isSystem ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          System
                        </span>
                      ) : null}
                      {!section.isActive ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Hidden
                        </span>
                      ) : null}
                    </div>
                    {section.hint ? (
                      <p className="text-sm text-gray-600">{section.hint}</p>
                    ) : null}
                    <p className="text-xs text-gray-400 mt-2">Sort order {section.sortOrder}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(section)}
                      className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    {!section.isSystem ? (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={async () => {
                          const confirmed = window.confirm(
                            `Delete section "${section.label}"? This only works if no articles use it.`,
                          );
                          if (!confirmed) return;
                          try {
                            await deleteSection(section.id);
                            if (editingId === section.id) resetDraft();
                          } catch (err: any) {
                            setError(err?.message || 'Failed to delete section');
                          }
                        }}
                        className="px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

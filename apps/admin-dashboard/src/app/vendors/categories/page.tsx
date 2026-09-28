'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { flattenVendorCategories, useVendorCategoryTree, type AdminVendorCategory } from '@/hooks/useVendors';

type Draft = { name: string; slug: string; description: string; parentId: string };

const emptyDraft = (): Draft => ({ name: '', slug: '', description: '', parentId: '' });

export default function VendorCategoriesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useVendorCategoryTree();
  const tree = data || [];
  const flat = useMemo(() => flattenVendorCategories(tree), [tree]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [mergeFrom, setMergeFrom] = useState<string | null>(null);
  const [mergeInto, setMergeInto] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-vendor-categories'] });
  };

  const run = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      setFormError(null);
      await refresh();
    },
    onError: (err: Error) => setFormError(err.message || 'Could not save the category'),
  });

  const parents = tree.filter((row) => !row.parentId);

  const move = (siblings: AdminVendorCategory[], index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= siblings.length) return;
    const ordered = siblings.slice();
    const [item] = ordered.splice(index, 1);
    ordered.splice(next, 0, item);
    run.mutate(async () => {
      await api.patch('/admin/vendor-categories/reorder', {
        items: ordered.map((row, sortOrder) => ({ id: row.id, sortOrder })),
      });
      setNotice('Order saved.');
    });
  };

  const renderRow = (row: AdminVendorCategory, siblings: AdminVendorCategory[], index: number, depth: number) => (
    <div key={row.id} className="border-b last:border-b-0">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ paddingLeft: 16 + depth * 24 }}>
        <div className="min-w-[180px] flex-1">
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.slug}{row.description ? ` · ${row.description}` : ''}</p>
        </div>
        <span className="text-sm text-gray-600">{row.vendorCount} vendor{row.vendorCount === 1 ? '' : 's'}</span>
        <button
          type="button"
          className={`text-xs px-2 py-1 rounded-full ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
          onClick={() =>
            run.mutate(async () => {
              await api.patch(`/admin/vendor-categories/${row.id}`, { isActive: !row.isActive });
              setNotice(row.isActive ? 'Category hidden from public filters.' : 'Category is active again.');
            })
          }
        >
          {row.isActive ? 'Active' : 'Hidden'}
        </button>
        <button type="button" className="text-sm text-gray-600" onClick={() => move(siblings, index, -1)} aria-label={`Move ${row.name} up`}>Up</button>
        <button type="button" className="text-sm text-gray-600" onClick={() => move(siblings, index, 1)} aria-label={`Move ${row.name} down`}>Down</button>
        <button
          type="button"
          className="text-sm text-blue-700"
          onClick={() => {
            setEditing(row.id);
            setEditDraft({ name: row.name, slug: row.slug, description: row.description || '', parentId: row.parentId || '' });
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="text-sm text-red-700"
          onClick={() => {
            if (row.vendorCount > 0 || row.children.some((child) => child.vendorCount > 0)) {
              setMergeFrom(row.id);
              setMergeInto('');
              setFormError('This category is in use. Merge it into another category, or hide it.');
              return;
            }
            run.mutate(async () => {
              await api.delete(`/admin/vendor-categories/${row.id}`);
              setNotice(`${row.name} deleted.`);
            });
          }}
        >
          Delete
        </button>
      </div>
      {editing === row.id ? (
        <form
          className="px-4 pb-4 grid gap-2 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            run.mutate(async () => {
              await api.patch(`/admin/vendor-categories/${row.id}`, {
                name: editDraft.name,
                slug: editDraft.slug,
                description: editDraft.description,
              });
              setEditing(null);
              setNotice('Category updated. The previous slug still opens this category.');
            });
          }}
        >
          <input className="border rounded-lg px-3 py-2" value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} required />
          <input className="border rounded-lg px-3 py-2" value={editDraft.slug} onChange={(e) => setEditDraft({ ...editDraft, slug: e.target.value })} required />
          <input className="border rounded-lg px-3 py-2" value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} placeholder="Description" />
          <button type="submit" className="rounded-lg bg-gray-900 text-white px-3 py-2">Save</button>
        </form>
      ) : null}
      {mergeFrom === row.id ? (
        <form
          className="px-4 pb-4 flex flex-wrap gap-2 items-center"
          onSubmit={(event) => {
            event.preventDefault();
            if (!mergeInto) return;
            run.mutate(async () => {
              await api.post(`/admin/vendor-categories/${row.id}/merge`, { intoId: mergeInto });
              setMergeFrom(null);
              setNotice(`${row.name} was merged. Its old filter link now opens the category you chose.`);
            });
          }}
        >
          <select className="border rounded-lg px-3 py-2" value={mergeInto} onChange={(e) => setMergeInto(e.target.value)} required>
            <option value="">Merge into…</option>
            {flat.filter((item) => item.id !== row.id).map((item) => (
              <option key={item.id} value={item.id}>{item.group === item.label ? item.label : `${item.group}: ${item.label}`}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-gray-900 text-white px-3 py-2">Merge</button>
          <button type="button" className="text-sm text-gray-600" onClick={() => setMergeFrom(null)}>Cancel</button>
        </form>
      ) : null}
      {row.children.map((child, childIndex) => renderRow(child, row.children, childIndex, depth + 1))}
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/vendors" className="text-sm text-blue-700">Back to vendors</Link>
        <h1 className="text-3xl font-bold font-poppins mt-2">Vendor categories</h1>
        <p className="text-gray-500 mt-1">Add, rename, reorder, hide, or retire categories without a deploy.</p>
      </div>

      <form
        className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          run.mutate(async () => {
            await api.post('/admin/vendor-categories', {
              name: draft.name,
              slug: draft.slug || undefined,
              description: draft.description || undefined,
              parentId: draft.parentId || undefined,
            });
            setDraft(emptyDraft());
            setNotice(draft.parentId ? 'Sub-category added.' : 'Category added.');
          });
        }}
      >
        <input className="border rounded-lg px-3 py-2" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
        <input className="border rounded-lg px-3 py-2" placeholder="Slug (optional)" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        <input className="border rounded-lg px-3 py-2" placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <select className="border rounded-lg px-3 py-2" value={draft.parentId} onChange={(e) => setDraft({ ...draft, parentId: e.target.value })} aria-label="Parent category">
          <option value="">Top-level category</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>Sub-category of {parent.name}</option>
          ))}
        </select>
        <button type="submit" disabled={run.isPending} className="rounded-lg bg-blue-600 text-white px-3 py-2 disabled:opacity-50">
          {draft.parentId ? 'Add sub-category' : 'Add category'}
        </button>
      </form>

      {notice ? <p className="text-sm text-green-700">{notice}</p> : null}
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {isLoading ? <p className="p-4 text-sm text-gray-500">Loading categories…</p> : null}
        {!isLoading && tree.length === 0 ? <p className="p-4 text-sm text-gray-500">No categories yet.</p> : null}
        {tree.map((row, index) => renderRow(row, tree, index, 0))}
      </div>
    </div>
  );
}

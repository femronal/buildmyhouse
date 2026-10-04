'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type CatalogItem = {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
  seeded?: boolean;
  professionalNote?: string | null;
  listingCount: number;
};

type CatalogTrade = {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
  seeded: boolean;
  listingCount: number;
  problems: CatalogItem[];
  services: CatalogItem[];
  specialties: CatalogItem[];
};

const KINDS = [
  { value: 'problem', label: 'Problem they solve' },
  { value: 'service', label: 'Service' },
  { value: 'specialty', label: 'Specialty' },
] as const;

export default function ArtisanCatalogPanel() {
  const queryClient = useQueryClient();
  const catalog = useQuery({
    queryKey: ['artisan-catalog'],
    queryFn: () => api.get<{ trades: CatalogTrade[] }>('/admin/artisans/catalog'),
  });
  const trades = catalog.data?.trades || [];
  const [tradeName, setTradeName] = useState('');
  const [tradeId, setTradeId] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number]['value']>('problem');
  const [fieldName, setFieldName] = useState('');
  const [note, setNote] = useState('');
  const [editingTrade, setEditingTrade] = useState<string | null>(null);
  const [tradeDraft, setTradeDraft] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldDraft, setFieldDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['artisan-catalog'] });
    await queryClient.invalidateQueries({ queryKey: ['artisan-admin-meta'] });
  };

  const run = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      setFormError(null);
      await refresh();
    },
    onError: (err: Error) => setFormError(err.message || 'Could not save that change'),
  });

  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= trades.length) return;
    const ordered = trades.slice();
    const [item] = ordered.splice(index, 1);
    ordered.splice(next, 0, item);
    run.mutate(async () => {
      await api.patch('/admin/artisans/trades/reorder', { ids: ordered.map((row) => row.id) });
      setNotice('Order saved.');
    });
  };

  const groups = (trade: CatalogTrade) =>
    [
      { title: 'Problems', items: trade.problems },
      { title: 'Services', items: trade.services },
      { title: 'Specialties', items: trade.specialties },
    ] as const;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Trades and problems</h2>
        <p className="mt-1 text-sm text-gray-600">
          Add a trade, a repair problem, a service, or a specialty without a deploy. The public directory uses these so people can search by what needs fixing.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          run.mutate(async () => {
            await api.post('/admin/artisans/trades', { label: tradeName });
            setTradeName('');
            setNotice('Trade added. It appears in the public directory filters.');
          });
        }}
      >
        <input className="rounded-lg border px-3 py-2 md:col-span-3" placeholder="New trade, for example Solar cleaner" value={tradeName} onChange={(event) => setTradeName(event.target.value)} required />
        <button type="submit" disabled={run.isPending} className="rounded-lg bg-gray-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Add trade
        </button>
      </form>

      <form
        className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!tradeId) return;
          run.mutate(async () => {
            await api.post(`/admin/artisans/trades/${tradeId}/capabilities`, {
              kind,
              label: fieldName,
              professionalNote: kind === 'problem' ? note : undefined,
            });
            setFieldName('');
            setNote('');
            setNotice(kind === 'problem' ? 'Problem added to that trade.' : 'Field added to that trade.');
          });
        }}
      >
        <select className="rounded-lg border px-3 py-2" value={tradeId} onChange={(event) => setTradeId(event.target.value)} required aria-label="Trade">
          <option value="">Choose a trade</option>
          {trades.map((trade) => (
            <option key={trade.id} value={trade.id}>{trade.label}</option>
          ))}
        </select>
        <select className="rounded-lg border px-3 py-2" value={kind} onChange={(event) => setKind(event.target.value as (typeof KINDS)[number]['value'])} aria-label="Kind of field">
          {KINDS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <input className="rounded-lg border px-3 py-2" placeholder="Name" value={fieldName} onChange={(event) => setFieldName(event.target.value)} required />
        <button type="submit" disabled={run.isPending} className="rounded-lg bg-gray-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Add field
        </button>
        {kind === 'problem' ? (
          <input className="rounded-lg border px-3 py-2 md:col-span-4" placeholder="Optional note, for example when a professional should also be involved" value={note} onChange={(event) => setNote(event.target.value)} />
        ) : null}
      </form>

      {notice ? <p className="text-sm text-green-700">{notice}</p> : null}
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {catalog.error ? <p className="text-sm text-red-600">{(catalog.error as Error).message}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {catalog.isLoading ? <p className="p-4 text-sm text-gray-500">Loading trades…</p> : null}
        {!catalog.isLoading && trades.length === 0 ? <p className="p-4 text-sm text-gray-500">No trades yet.</p> : null}
        {trades.map((trade, index) => (
          <div key={trade.id} className="border-b last:border-b-0">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-[180px] flex-1">
                <p className="font-medium text-gray-900">{trade.label}</p>
                <p className="text-xs text-gray-500">{trade.key} · {trade.listingCount} listing{trade.listingCount === 1 ? '' : 's'}</p>
              </div>
              <button
                type="button"
                className={`rounded-full px-2 py-1 text-xs ${trade.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
                onClick={() =>
                  run.mutate(async () => {
                    await api.patch(`/admin/artisans/trades/${trade.id}`, { isActive: !trade.isActive });
                    setNotice(trade.isActive ? 'Trade hidden from public filters.' : 'Trade is public again.');
                  })
                }
              >
                {trade.isActive ? 'Active' : 'Hidden'}
              </button>
              <button type="button" className="text-sm text-gray-600" onClick={() => move(index, -1)} aria-label={`Move ${trade.label} up`}>Up</button>
              <button type="button" className="text-sm text-gray-600" onClick={() => move(index, 1)} aria-label={`Move ${trade.label} down`}>Down</button>
              <button
                type="button"
                className="text-sm text-blue-700"
                onClick={() => {
                  setEditingTrade(trade.id);
                  setTradeDraft(trade.label);
                }}
              >
                Rename
              </button>
              {trade.seeded ? null : (
                <button
                  type="button"
                  className="text-sm text-red-700"
                  onClick={() => {
                    run.mutate(async () => {
                      await api.delete(`/admin/artisans/trades/${trade.id}`);
                      setNotice(`${trade.label} deleted.`);
                    });
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            {editingTrade === trade.id ? (
              <form
                className="flex flex-wrap gap-2 px-4 pb-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  run.mutate(async () => {
                    await api.patch(`/admin/artisans/trades/${trade.id}`, { label: tradeDraft });
                    setEditingTrade(null);
                    setNotice('Trade renamed. Existing filter links still use the original key.');
                  });
                }}
              >
                <input className="rounded-lg border px-3 py-2" value={tradeDraft} onChange={(event) => setTradeDraft(event.target.value)} required />
                <button type="submit" className="rounded-lg bg-gray-950 px-3 py-2 text-sm text-white">Save</button>
              </form>
            ) : null}
            <div className="grid gap-4 px-4 pb-4 md:grid-cols-3">
              {groups(trade).map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{group.title}</p>
                  {group.items.length === 0 ? <p className="mt-2 text-sm text-gray-400">None yet</p> : null}
                  <ul className="mt-2 space-y-2">
                    {group.items.map((item) => (
                      <li key={item.id} className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={item.isActive ? 'text-gray-900' : 'text-gray-400'}>{item.label}</span>
                          <button
                            type="button"
                            className="text-xs text-gray-500"
                            onClick={() =>
                              run.mutate(async () => {
                                await api.patch(`/admin/artisans/capabilities/${item.id}`, { isActive: !item.isActive });
                                setNotice(item.isActive ? `${item.label} hidden from public filters.` : `${item.label} is public again.`);
                              })
                            }
                          >
                            {item.isActive ? 'Hide' : 'Show'}
                          </button>
                          <button
                            type="button"
                            className="text-xs text-blue-700"
                            onClick={() => {
                              setEditingField(item.id);
                              setFieldDraft(item.label);
                              setNoteDraft(item.professionalNote || '');
                            }}
                          >
                            Edit
                          </button>
                          {item.seeded ? null : (
                            <button
                              type="button"
                              className="text-xs text-red-700"
                              onClick={() =>
                                run.mutate(async () => {
                                  await api.delete(`/admin/artisans/capabilities/${item.id}`);
                                  setNotice(`${item.label} deleted.`);
                                })
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        {item.professionalNote ? <p className="text-xs text-gray-500">{item.professionalNote}</p> : null}
                        {editingField === item.id ? (
                          <form
                            className="mt-2 grid gap-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              run.mutate(async () => {
                                await api.patch(`/admin/artisans/capabilities/${item.id}`, {
                                  label: fieldDraft,
                                  professionalNote: group.title === 'Problems' ? noteDraft : undefined,
                                });
                                setEditingField(null);
                                setNotice('Saved.');
                              });
                            }}
                          >
                            <input className="rounded-lg border px-3 py-2" value={fieldDraft} onChange={(event) => setFieldDraft(event.target.value)} required />
                            {group.title === 'Problems' ? (
                              <input className="rounded-lg border px-3 py-2" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Note shown on the directory" />
                            ) : null}
                            <button type="submit" className="w-fit rounded-lg bg-gray-950 px-3 py-2 text-xs text-white">Save</button>
                          </form>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

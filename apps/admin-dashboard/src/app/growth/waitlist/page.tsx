'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ClipboardList, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import {
  WAITLIST_PURPOSES,
  formatWaitlistDate,
  purposeLabel,
  type AdminWaitlist,
  type WaitlistPerson,
  type WaitlistPurpose,
  type WaitlistSignup,
} from '@/lib/waitlist';

type ListsResponse = { items: AdminWaitlist[] };
type SignupsResponse = { count: number; items: WaitlistSignup[] };
type PeopleResponse = { count: number; items: WaitlistPerson[] };

type CreateForm = {
  name: string;
  purpose: WaitlistPurpose;
  key: string;
  pagePath: string;
  description: string;
};

const EMPTY_FORM: CreateForm = {
  name: '',
  purpose: 'tool',
  key: '',
  pagePath: '',
  description: '',
};

export default function GrowthWaitlistPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'waitlists' | 'people'>('waitlists');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const listsQuery = useQuery({
    queryKey: ['waitlist-lists'],
    queryFn: () => api.get<ListsResponse>('/waitlist/admin/lists'),
  });

  const signupsQuery = useQuery({
    queryKey: ['waitlist-signups', selectedKey],
    queryFn: () =>
      api.get<SignupsResponse>(
        selectedKey
          ? `/waitlist/admin?productKey=${encodeURIComponent(selectedKey)}`
          : '/waitlist/admin',
      ),
  });

  const peopleQuery = useQuery({
    queryKey: ['waitlist-people'],
    queryFn: () => api.get<PeopleResponse>('/waitlist/admin/people'),
    enabled: view === 'people',
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateForm) =>
      api.post('/waitlist/admin/lists', {
        name: body.name,
        purpose: body.purpose,
        key: body.key || undefined,
        pagePath: body.pagePath || undefined,
        description: body.description || undefined,
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setShowForm(false);
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['waitlist-lists'] });
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Could not create waitlist');
    },
  });

  const lists = listsQuery.data?.items ?? [];
  const selectedList = lists.find((item) => item.key === selectedKey) || null;
  const signups = signupsQuery.data?.items ?? [];
  const people = peopleQuery.data?.items ?? [];

  const summary = useMemo(() => {
    const totalSignups = lists.reduce((sum, item) => sum + item.signupCount, 0);
    return { lists: lists.length, signups: totalSignups };
  }, [lists]);

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <Link
          href="/growth"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Growth
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-900 p-2 text-white">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Growth
              </p>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Waitlist</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                Create a waitlist for a tool, webinar, podcast, book or meeting. Attach it to a page
                that explains why people should join, then see who signed up and for what.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm((open) => !open);
              setFormError(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New waitlist
          </button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Waitlists</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.lists}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">People signed up</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.signups}</p>
        </div>
      </div>

      {showForm ? (
        <form
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.name.trim()) {
              setFormError('Give the waitlist a name.');
              return;
            }
            createMutation.mutate(form);
          }}
        >
          <h2 className="text-base font-semibold text-gray-900">Create a waitlist</h2>
          <p className="mt-1 text-sm text-gray-600">
            The key is what the public form sends. The page is where people read why they should join.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm text-gray-700">
              Name
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Lagos contractor webinar"
              />
            </label>
            <label className="text-sm text-gray-700">
              Purpose
              <select
                value={form.purpose}
                onChange={(event) =>
                  setForm((current) => ({ ...current, purpose: event.target.value as WaitlistPurpose }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {WAITLIST_PURPOSES.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purposeLabel(purpose)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Key (optional)
              <input
                value={form.key}
                onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="lagos-contractor-webinar"
              />
            </label>
            <label className="text-sm text-gray-700">
              Attached page
              <input
                value={form.pagePath}
                onChange={(event) => setForm((current) => ({ ...current, pagePath: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="/land-verification-in-nigeria-guide"
              />
            </label>
            <label className="text-sm text-gray-700 md:col-span-2">
              Why people should join
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Tell people what they will get when this launches or happens."
              />
            </label>
          </div>
          {formError ? <p className="mt-3 text-sm text-red-600">{formError}</p> : null}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Saving…' : 'Save waitlist'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError(null);
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView('waitlists')}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            view === 'waitlists' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Waitlists
        </button>
        <button
          type="button"
          onClick={() => setView('people')}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            view === 'people' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          People
        </button>
      </div>

      {view === 'waitlists' ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,340px)_1fr]">
          <section className="space-y-3">
            {listsQuery.isLoading ? <p className="text-sm text-gray-500">Loading waitlists…</p> : null}
            {listsQuery.error ? (
              <p className="text-sm text-red-600">
                {listsQuery.error instanceof Error ? listsQuery.error.message : 'Failed to load waitlists'}
              </p>
            ) : null}
            {lists.map((list) => {
              const active = selectedKey === list.key;
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setSelectedKey(list.key)}
                  className={`w-full rounded-xl border p-4 text-left shadow-sm ${
                    active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-gray-900">{list.name}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                      {purposeLabel(list.purpose)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {list.signupCount} {list.signupCount === 1 ? 'person' : 'people'}
                    {list.isActive ? '' : ' · paused'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{list.pagePath || 'No page attached yet'}</p>
                </button>
              );
            })}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            {!selectedList ? (
              <p className="text-sm text-gray-600">
                Choose a waitlist to see who joined and why.
              </p>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900">{selectedList.name}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Purpose: {purposeLabel(selectedList.purpose)}
                  {selectedList.pagePath ? ` · Page: ${selectedList.pagePath}` : ''}
                </p>
                {selectedList.description ? (
                  <p className="mt-2 text-sm text-gray-600">{selectedList.description}</p>
                ) : null}
                <p className="mt-3 text-xs text-gray-500">
                  Form key: <code className="rounded bg-gray-100 px-1 py-0.5">{selectedList.key}</code>
                </p>
                {signupsQuery.isLoading ? (
                  <p className="mt-4 text-sm text-gray-500">Loading people…</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                          <th className="px-3 py-2 font-medium">Email</th>
                          <th className="px-3 py-2 font-medium">Name</th>
                          <th className="px-3 py-2 font-medium">Joined from</th>
                          <th className="px-3 py-2 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {signups.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                              Nobody has joined this waitlist yet.
                            </td>
                          </tr>
                        ) : (
                          signups.map((item) => (
                            <tr key={item.id} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-900">{item.email}</td>
                              <td className="px-3 py-2 text-gray-700">{item.fullName || '—'}</td>
                              <td className="px-3 py-2 text-gray-700">{item.sourcePath || item.pagePath || '—'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                                {formatWaitlistDate(item.createdAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      ) : (
        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {peopleQuery.isLoading ? <p className="p-5 text-sm text-gray-500">Loading people…</p> : null}
          {peopleQuery.error ? (
            <p className="p-5 text-sm text-red-600">
              {peopleQuery.error instanceof Error ? peopleQuery.error.message : 'Failed to load people'}
            </p>
          ) : null}
          {!peopleQuery.isLoading && !peopleQuery.error ? (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">On the waitlist for</th>
                  <th className="px-4 py-3 font-medium">First joined</th>
                </tr>
              </thead>
              <tbody>
                {people.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No waitlist signups yet.
                    </td>
                  </tr>
                ) : (
                  people.map((person) => (
                    <tr key={person.email} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{person.email}</p>
                        <p className="text-xs text-gray-500">{person.fullName || 'No name given'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1">
                          {person.purposes.map((item) => (
                            <li key={`${person.email}-${item.productKey}`}>
                              <span className="font-medium text-gray-900">{item.waitlistName}</span>
                              <span className="text-gray-500"> · {purposeLabel(item.purpose)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {formatWaitlistDate(person.joinedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}
        </section>
      )}
    </div>
  );
}

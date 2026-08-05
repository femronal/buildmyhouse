'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useHrFeedback } from '@/components/people/HrDialogs';
import { useCreateStaff, useHrDepartments, useHrPeople, useHrPositions } from '@/hooks/usePeopleHr';

const WORKFORCE_TYPES = [
  'employee',
  'fixed_term',
  'consultant',
  'independent_contractor',
  'intern',
  'freelancer',
  'executive',
  'temporary',
];

export default function PeopleDirectoryPage() {
  const [q, setQ] = useState('');
  const { data: people = [], isLoading, error } = useHrPeople(q);
  const { data: departments = [] } = useHrDepartments();
  const { data: positions = [] } = useHrPositions();
  const createStaff = useCreateStaff();
  const { notify, feedbackModal } = useHrFeedback();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    workforceType: 'employee',
    departmentId: '',
    positionId: '',
    employmentStatus: 'onboarding',
  });

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const person = await createStaff.mutateAsync({
        ...form,
        departmentId: form.departmentId || undefined,
        positionId: form.positionId || undefined,
      });
      setShowAdd(false);
      window.location.href = `/people/directory/${person.id}`;
    } catch (err: any) {
      notify('error', 'Could not create profile', err?.message || 'Failed to create staff profile.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">People directory</h2>
          <p className="text-sm text-gray-500">Internal staff, consultants, and contractors.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Add person
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border bg-white py-2 pl-10 pr-3 text-sm"
        />
      </div>

      {isLoading && <p className="text-gray-500">Loading people…</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {people.length === 0 && !isLoading ? (
          <p className="p-8 text-center text-gray-500">No people yet. Add a staff member or hire a candidate.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {people.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/people/directory/${person.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {person.fullName}
                    </Link>
                    <p className="text-xs text-gray-500">{person.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{person.workforceType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{person.department?.name || '—'}</td>
                  <td className="px-4 py-3">{person.position?.name || '—'}</td>
                  <td className="px-4 py-3 capitalize">{person.employmentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={onCreate} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Add person</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="First name"
                className="rounded-lg border px-3 py-2"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              />
              <input
                required
                placeholder="Last name"
                className="rounded-lg border px-3 py-2"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              />
              <input
                required
                type="email"
                placeholder="Email"
                className="rounded-lg border px-3 py-2 sm:col-span-2"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
              <select
                className="rounded-lg border px-3 py-2"
                value={form.workforceType}
                onChange={(e) => setForm((p) => ({ ...p, workforceType: e.target.value }))}
              >
                {WORKFORCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border px-3 py-2"
                value={form.employmentStatus}
                onChange={(e) => setForm((p) => ({ ...p, employmentStatus: e.target.value }))}
              >
                {['onboarding', 'active', 'probation', 'leave', 'suspended', 'exited'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border px-3 py-2 sm:col-span-2"
                value={form.departmentId}
                onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
              >
                <option value="">Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border px-3 py-2 sm:col-span-2"
                value={form.positionId}
                onChange={(e) => setForm((p) => ({ ...p, positionId: e.target.value }))}
              >
                <option value="">Position</option>
                {positions
                  .filter((p) => !form.departmentId || p.departmentId === form.departmentId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
                disabled={createStaff.isPending}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {feedbackModal}
    </div>
  );
}

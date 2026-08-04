'use client';

import { FormEvent, useState } from 'react';
import {
  useCreateDepartment,
  useCreatePosition,
  useHrDepartments,
  useHrPositions,
} from '@/hooks/usePeopleHr';

export default function StructurePage() {
  const { data: departments = [], isLoading } = useHrDepartments();
  const { data: positions = [] } = useHrPositions();
  const createDept = useCreateDepartment();
  const createPos = useCreatePosition();
  const [deptName, setDeptName] = useState('');
  const [posForm, setPosForm] = useState({
    departmentId: '',
    name: '',
    description: '',
  });

  const onCreateDept = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createDept.mutateAsync({ name: deptName });
      setDeptName('');
    } catch (err: any) {
      window.alert(err?.message || 'Failed');
    }
  };

  const onCreatePos = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createPos.mutateAsync(posForm);
      setPosForm({ departmentId: '', name: '', description: '' });
    } catch (err: any) {
      window.alert(err?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Departments & positions</h2>
        <p className="text-sm text-gray-500">
          Organisational structure only — not system permissions.
        </p>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="font-semibold">Departments</h3>
          <form onSubmit={onCreateDept} className="mt-3 flex gap-2">
            <input
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              placeholder="New department"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              required
            />
            <button type="submit" className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white">
              Add
            </button>
          </form>
          <ul className="mt-4 divide-y">
            {departments.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{d.name}</span>
                <span className="text-gray-400">
                  {d._count?.staff ?? 0} people · {d._count?.positions ?? 0} roles
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="font-semibold">Positions</h3>
          <form onSubmit={onCreatePos} className="mt-3 space-y-2">
            <select
              required
              value={posForm.departmentId}
              onChange={(e) => setPosForm((p) => ({ ...p, departmentId: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              required
              value={posForm.name}
              onChange={(e) => setPosForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Position name"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <textarea
              value={posForm.description}
              onChange={(e) => setPosForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
            />
            <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
              Add position
            </button>
          </form>
          <ul className="mt-4 divide-y">
            {positions.map((p) => (
              <li key={p.id} className="py-2 text-sm">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.department?.name} · {p.active ? 'Active' : 'Inactive'}
                  {Array.isArray(p.kpiDefinitions)
                    ? ` · ${(p.kpiDefinitions as unknown[]).length} KPIs`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

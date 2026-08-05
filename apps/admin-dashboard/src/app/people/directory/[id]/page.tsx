'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AddKpiModal,
  useHrConfirm,
  useHrFeedback,
} from '@/components/people/HrDialogs';
import {
  useAssignStaffRole,
  useCreatePerformanceGoal,
  useHrPerson,
  useHrRoles,
  useOffboardStaff,
  useUpdateOnboardingTask,
} from '@/hooks/usePeopleHr';

const TABS = [
  'Overview',
  'Employment',
  'Performance',
  'Documents',
  'Permissions',
  'Notes',
] as const;

export default function PersonDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const { data: person, isLoading, error } = useHrPerson(id);
  const { data: roles = [] } = useHrRoles();
  const updateTask = useUpdateOnboardingTask();
  const offboard = useOffboardStaff();
  const assignRole = useAssignStaffRole();
  const createGoal = useCreatePerformanceGoal();
  const { notify, feedbackModal } = useHrFeedback();
  const { askConfirm, confirmModal } = useHrConfirm();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const [roleId, setRoleId] = useState('');
  const [showAddKpi, setShowAddKpi] = useState(false);

  const pendingOnboarding = useMemo(
    () => (person?.onboardingTasks || []).filter((t) => t.status === 'pending').length,
    [person],
  );

  if (isLoading) return <p className="text-gray-500">Loading profile…</p>;
  if (error) return <p className="text-red-600">{(error as Error).message}</p>;
  if (!person) return <p className="text-gray-500">Person not found</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/people/directory" className="text-sm text-blue-600 hover:underline">
            ← Directory
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{person.fullName}</h2>
          <p className="text-sm text-gray-500">
            {person.position?.name || 'No position'} · {person.department?.name || 'No department'} ·{' '}
            <span className="capitalize">{person.employmentStatus}</span>
          </p>
        </div>
        {person.employmentStatus !== 'exited' && (
          <button
            type="button"
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            onClick={() =>
              askConfirm({
                title: 'Offboard staff member',
                message: `Offboard ${person.fullName}? Their dashboard access will be disabled and permissions revoked. Historical records are kept.`,
                confirmLabel: 'Offboard',
                danger: true,
                onConfirm: async () => {
                  try {
                    await offboard.mutateAsync({
                      id: person.id,
                      payload: {
                        exitDate: new Date().toISOString(),
                        exitReason: 'Offboarded from admin',
                        disableAccount: true,
                        revokePermissions: true,
                      },
                    });
                    notify('success', 'Staff offboarded', `${person.fullName} has been exited and access revoked.`);
                  } catch (err: any) {
                    notify('error', 'Offboard failed', err?.message || 'Could not offboard this person.');
                    throw err;
                  }
                },
              })
            }
          >
            Offboard
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === item ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow">
            <h3 className="font-semibold">Identity</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Email</dt>
                <dd>{person.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Phone</dt>
                <dd>{person.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Workforce type</dt>
                <dd className="capitalize">{person.workforceType.replace(/_/g, ' ')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Login</dt>
                <dd>{person.user ? 'Linked' : 'No account'}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <h3 className="font-semibold">Onboarding ({pendingOnboarding} pending)</h3>
            <div className="mt-3 space-y-2">
              {(person.onboardingTasks || []).map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{task.title}</span>
                  <select
                    value={task.status}
                    className="rounded border px-2 py-1 text-xs"
                    onChange={(e) =>
                      void updateTask.mutateAsync({
                        staffId: person.id,
                        taskId: task.id,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="completed">completed</option>
                    <option value="waived">waived</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Employment' && (
        <div className="rounded-xl bg-white p-4 shadow text-sm space-y-2">
          <p>
            <span className="text-gray-500">Start date:</span>{' '}
            {person.startDate ? new Date(person.startDate).toLocaleDateString() : '—'}
          </p>
          <p>
            <span className="text-gray-500">Probation end:</span>{' '}
            {person.probationEndDate
              ? new Date(person.probationEndDate).toLocaleDateString()
              : '—'}
          </p>
          <p>
            <span className="text-gray-500">Work location:</span> {person.workLocation || '—'}
          </p>
          {person.compensationRestricted ? (
            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
              Compensation is restricted. Requires `hr.compensation.view`.
            </p>
          ) : (
            <p>
              <span className="text-gray-500">Base compensation:</span>{' '}
              {person.baseCompensation ?? '—'}
            </p>
          )}
        </div>
      )}

      {tab === 'Performance' && (
        <div className="space-y-3">
          <button
            type="button"
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white"
            onClick={() => setShowAddKpi(true)}
          >
            Add KPI
          </button>
          <div className="rounded-xl bg-white shadow divide-y">
            {(person.performanceGoals || []).length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No KPIs yet.</p>
            ) : (
              (person.performanceGoals || []).map((goal) => (
                <div key={goal.id} className="p-4 text-sm">
                  <p className="font-medium">{goal.kpi}</p>
                  <p className="text-gray-500">
                    Target {goal.target} · Period {goal.period} · {goal.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'Documents' && (
        <div className="rounded-xl bg-white shadow divide-y">
          {(person.documents || []).length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              No documents on this profile. Upload from Documents.
            </p>
          ) : (
            (person.documents || []).map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="block p-4 text-sm hover:bg-gray-50"
              >
                {doc.category} · {new Date(doc.createdAt).toLocaleDateString()}
              </a>
            ))
          )}
        </div>
      )}

      {tab === 'Permissions' && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow">
          <div className="flex flex-wrap gap-2">
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Assign role…</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!roleId}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={async () => {
                try {
                  await assignRole.mutateAsync({ staffId: person.id, roleId });
                  setRoleId('');
                  notify('success', 'Role assigned', 'The permission role was added to this staff profile.');
                } catch (err: any) {
                  notify('error', 'Assign failed', err?.message || 'Could not assign this role.');
                }
              }}
            >
              Assign
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {(person.roleAssignments || []).map((assignment) => (
              <li key={assignment.id} className="rounded border px-3 py-2">
                {assignment.role.name}
              </li>
            ))}
            {(person.roleAssignments || []).length === 0 && (
              <li className="text-gray-500">No limited roles assigned (full-admin rules may apply).</li>
            )}
          </ul>
        </div>
      )}

      {tab === 'Notes' && (
        <div className="rounded-xl bg-white p-4 shadow text-sm whitespace-pre-wrap">
          {person.notes || 'No notes.'}
        </div>
      )}

      <AddKpiModal
        open={showAddKpi}
        busy={createGoal.isPending}
        onClose={() => setShowAddKpi(false)}
        onSubmit={async (values) => {
          try {
            await createGoal.mutateAsync({
              staffProfileId: person.id,
              ...values,
            });
            setShowAddKpi(false);
            notify('success', 'KPI added', `${values.kpi} was saved for ${person.fullName}.`);
          } catch (err: any) {
            notify('error', 'Could not add KPI', err?.message || 'Failed to create goal.');
          }
        }}
      />

      {feedbackModal}
      {confirmModal}
    </div>
  );
}

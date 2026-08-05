'use client';

import { FormEvent, useMemo, useState } from 'react';
import { HrModalShell } from '@/components/people/HrDialogs';
import { useHrPeople } from '@/hooks/usePeopleHr';
import { useAccessRoles, type GrantAccessPayload } from '@/hooks/useAdminAccess';

const RELATIONSHIPS = [
  { value: 'employee', label: 'Employee' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'executive', label: 'Executive' },
  { value: 'external', label: 'External collaborator' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'technical_partner', label: 'Technical partner' },
  { value: 'service_account', label: 'Service account' },
  { value: 'test_account', label: 'Test account' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: GrantAccessPayload) => Promise<void>;
  busy?: boolean;
};

export default function GrantAccessModal({ open, onClose, onSubmit, busy }: Props) {
  const { data: people = [] } = useHrPeople();
  const { data: roles = [] } = useAccessRoles();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'staff' | 'external'>('staff');
  const [staffQuery, setStaffQuery] = useState('');
  const [staffProfileId, setStaffProfileId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [accessRelationship, setAccessRelationship] = useState('external');
  const [accessReason, setAccessReason] = useState('');
  const [roleKey, setRoleKey] = useState('operations_admin');
  const [duration, setDuration] = useState<'permanent' | '7' | '30' | '90' | 'custom'>('permanent');
  const [customExpiry, setCustomExpiry] = useState('');
  const [sendInvite, setSendInvite] = useState(true);

  const filteredPeople = useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    if (!q) return people.slice(0, 20);
    return people
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.position?.name || '').toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [people, staffQuery]);

  if (!open) return null;

  const reset = () => {
    setStep(1);
    setMode('staff');
    setStaffProfileId('');
    setFullName('');
    setEmail('');
    setOrganisation('');
    setAccessRelationship('external');
    setAccessReason('');
    setRoleKey('operations_admin');
    setDuration('permanent');
    setCustomExpiry('');
    setSendInvite(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const buildPayload = (): GrantAccessPayload => {
    const payload: GrantAccessPayload = {
      mode,
      roleKey,
      accessRelationship: mode === 'staff' ? accessRelationship || 'employee' : accessRelationship,
      accessReason: accessReason || undefined,
      organisation: organisation || undefined,
      sendInvite,
    };
    if (mode === 'staff') {
      payload.staffProfileId = staffProfileId;
      if (!accessRelationship || accessRelationship === 'external') {
        payload.accessRelationship = 'employee';
      }
    } else {
      payload.fullName = fullName.trim();
      payload.email = email.trim().toLowerCase();
    }
    if (duration === '7') payload.temporaryDays = 7;
    if (duration === '30') payload.temporaryDays = 30;
    if (duration === '90') payload.temporaryDays = 90;
    if (duration === 'custom' && customExpiry) {
      payload.accessExpiresAt = new Date(customExpiry).toISOString();
    }
    return payload;
  };

  const onFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    await onSubmit(buildPayload());
    handleClose();
  };

  const canContinue =
    step === 1
      ? mode === 'staff'
        ? Boolean(staffProfileId)
        : Boolean(fullName.trim() && email.trim())
      : step === 2
        ? Boolean(roleKey)
        : mode === 'external'
          ? duration !== 'permanent' || Boolean(accessReason.trim())
          : true;

  return (
    <HrModalShell title="Grant Admin Access" onClose={handleClose} maxWidthClassName="max-w-xl">
      <form onSubmit={onFormSubmit} className="space-y-4">
        <p className="text-xs text-gray-500">Step {step} of 3</p>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900">Who is this?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('staff')}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  mode === 'staff' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
              >
                Existing staff member
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('external');
                  setAccessRelationship('external');
                  if (duration === 'permanent') setDuration('30');
                }}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  mode === 'external'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                External person
              </button>
            </div>

            {mode === 'staff' ? (
              <>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Search People & HR…"
                  value={staffQuery}
                  onChange={(e) => setStaffQuery(e.target.value)}
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border">
                  {filteredPeople.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">No matching staff.</p>
                  ) : (
                    filteredPeople.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setStaffProfileId(person.id);
                          setAccessRelationship(
                            person.workforceType === 'consultant' ? 'consultant' : 'employee',
                          );
                        }}
                        className={`block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 ${
                          staffProfileId === person.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium">{person.fullName}</p>
                        <p className="text-xs text-gray-500">
                          {person.email} · {person.position?.name || 'No position'}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <input
                  required
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  required
                  type="email"
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Organisation"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                />
              </div>
            )}

            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={accessRelationship}
              onChange={(e) => setAccessRelationship(e.target.value)}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900">Role & reason</p>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value)}
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.key}>
                  {role.name}
                </option>
              ))}
            </select>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              placeholder="Why is access required?"
              value={accessReason}
              onChange={(e) => setAccessReason(e.target.value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900">Access duration</p>
            {mode === 'external' && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                External access should include an expiration date whenever possible.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(
                [
                  ['permanent', 'Permanent'],
                  ['7', '7 days'],
                  ['30', '30 days'],
                  ['90', '90 days'],
                  ['custom', 'Custom date'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDuration(value)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    duration === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {duration === 'custom' && (
              <input
                type="date"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={customExpiry}
                onChange={(e) => setCustomExpiry(e.target.value)}
              />
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
              />
              Email a secure setup link (recommended)
            </label>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={step === 1 ? handleClose : () => setStep((s) => s - 1)}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            type="submit"
            disabled={!canContinue || busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Working…' : step < 3 ? 'Continue' : 'Grant access'}
          </button>
        </div>
      </form>
    </HrModalShell>
  );
}

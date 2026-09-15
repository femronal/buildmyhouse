'use client';

import { FormEvent, useState } from 'react';

export type CredentialDraft = {
  registrationNumber: string;
  verificationSourceUrl: string;
  verificationNotes: string;
  markChecked: boolean;
};

export const EMPTY_CREDENTIAL_DRAFT: CredentialDraft = {
  registrationNumber: '',
  verificationSourceUrl: '',
  verificationNotes: '',
  markChecked: true,
};

export function regulatorCopy(profession?: {
  label?: string | null;
  regulatorLabel?: string | null;
  regulatorKey?: string | null;
  verificationMode?: string | null;
} | null) {
  const regulator = profession?.regulatorLabel || profession?.regulatorKey?.toUpperCase() || null;
  const documentsOnly = profession?.verificationMode === 'documents' || !regulator;
  return {
    regulator,
    heading: regulator ? `${regulator} credential / identity check` : 'Credential / identity check',
    numberLabel: regulator ? `${regulator} registration / licence number` : 'Registration / licence number',
    help: documentsOnly
      ? 'This category has no single statutory regulator. Record the document you checked. That is not the same as listing the professional.'
      : `Enter the ${regulator} number BuildMyHouse checked. Listing this person is not the same as checking this credential.`,
  };
}

export function CredentialCheckFields({
  profession,
  draft,
  onChange,
  requireNumber = false,
}: {
  profession?: {
    label?: string | null;
    regulatorLabel?: string | null;
    regulatorKey?: string | null;
    verificationMode?: string | null;
  } | null;
  draft: CredentialDraft;
  onChange: (next: CredentialDraft) => void;
  requireNumber?: boolean;
}) {
  const copy = regulatorCopy(profession);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold">{copy.heading}</h2>
        <p className="text-sm text-gray-600 mt-1">{copy.help}</p>
      </div>
      {copy.regulator && (
        <p className="text-sm">
          Licensing body: <span className="font-medium">{copy.regulator}</span>
          {profession?.label ? ` · ${profession.label}` : ''}
        </p>
      )}
      <label className="block text-sm">
        <span className="text-gray-700">{copy.numberLabel}</span>
        <input
          value={draft.registrationNumber}
          onChange={(e) => onChange({ ...draft, registrationNumber: e.target.value })}
          required={requireNumber && draft.markChecked}
          placeholder={copy.regulator ? `e.g. ${copy.regulator} number` : 'Registration number'}
          className="mt-1 w-full border rounded-lg px-3 py-2"
        />
      </label>
      <input
        value={draft.verificationSourceUrl}
        onChange={(e) => onChange({ ...draft, verificationSourceUrl: e.target.value })}
        placeholder="Source URL you checked (optional)"
        className="w-full border rounded-lg px-3 py-2"
      />
      <textarea
        value={draft.verificationNotes}
        onChange={(e) => onChange({ ...draft, verificationNotes: e.target.value })}
        placeholder="What you checked, and when"
        className="w-full border rounded-lg px-3 py-2 min-h-20"
      />
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={draft.markChecked}
          onChange={(e) => onChange({ ...draft, markChecked: e.target.checked })}
        />
        <span>
          Mark credential checked. This is not listing, claiming, or Used by BuildMyHouse.
        </span>
      </label>
    </div>
  );
}

export function CredentialCheckPanel({
  profession,
  initial,
  submitLabel = 'Save and mark credential checked',
  pending,
  error,
  onSubmit,
}: {
  profession?: {
    label?: string | null;
    regulatorLabel?: string | null;
    regulatorKey?: string | null;
    verificationMode?: string | null;
  } | null;
  initial?: Partial<CredentialDraft>;
  submitLabel?: string;
  pending?: boolean;
  error?: string;
  onSubmit: (draft: CredentialDraft) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<CredentialDraft>({ ...EMPTY_CREDENTIAL_DRAFT, ...initial });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(draft);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <CredentialCheckFields profession={profession} draft={draft} onChange={setDraft} requireNumber />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
      >
        {pending ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

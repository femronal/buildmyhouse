'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Copy, Link2, X } from 'lucide-react';
import { api } from '@/lib/api';
import {
  ManagedProjectScopeFields,
  buildManagedProjectPayload,
  createDefaultScope,
  validateManagedProjectScope,
  type ManagedProjectScope,
} from '@/components/ManagedProjectScopeFields';

type CreateManagedProjectResponse = {
  project: { id: string; name: string };
  links: {
    homeowner: { id: string; url: string; email: string };
    generalContractor: { id: string; url: string; email: string };
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const emptyContacts = {
  homeownerName: '',
  homeownerEmail: '',
  homeownerPhone: '',
  gcName: '',
  gcEmail: '',
  gcPhone: '',
};

export function CreateManagedProjectModal({ open, onClose, onCreated }: Props) {
  const [scope, setScope] = useState<ManagedProjectScope>(createDefaultScope());
  const [contacts, setContacts] = useState(emptyContacts);
  const [error, setError] = useState('');
  const [createdLinks, setCreatedLinks] = useState<CreateManagedProjectResponse['links'] | null>(null);

  useEffect(() => {
    if (!open) return;
    setScope(createDefaultScope());
    setContacts(emptyContacts);
    setError('');
    setCreatedLinks(null);
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = buildManagedProjectPayload(scope, contacts);
      return api.post<CreateManagedProjectResponse>(
        '/project-access/admin/managed-projects',
        payload,
      );
    },
    onSuccess: (data) => {
      setCreatedLinks(data.links);
      onCreated?.();
    },
    onError: (e: Error) => {
      setError(e.message || 'Failed to create managed project.');
    },
  });

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-semibold">Create managed project</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Build the project scope here, then send email-verified tracking links to homeowner and
              GC.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {createdLinks ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Managed project created. Invite emails were sent to both parties.
              </div>

              {([
                ['Homeowner link', createdLinks.homeowner],
                ['GC link', createdLinks.generalContractor],
              ] as const).map(([label, link]) => (
                <div key={label} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Link2 className="w-4 h-4" />
                    {label}
                  </div>
                  <p className="text-xs text-gray-500">{link.email}</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={link.url}
                      className="flex-1 text-xs border rounded-lg px-3 py-2 bg-gray-50 font-mono"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 border rounded-lg text-sm inline-flex items-center gap-1"
                      onClick={() => void copyText(link.url)}
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white text-sm"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <ManagedProjectScopeFields scope={scope} onChange={setScope} />

              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Homeowner contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Full name</span>
                    <input
                      value={contacts.homeownerName}
                      onChange={(e) =>
                        setContacts((prev) => ({ ...prev, homeownerName: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <input
                      value={contacts.homeownerEmail}
                      onChange={(e) =>
                        setContacts((prev) => ({ ...prev, homeownerEmail: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      type="email"
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Phone (optional)</span>
                    <input
                      value={contacts.homeownerPhone}
                      onChange={(e) =>
                        setContacts((prev) => ({ ...prev, homeownerPhone: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">General contractor contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Full name</span>
                    <input
                      value={contacts.gcName}
                      onChange={(e) => setContacts((prev) => ({ ...prev, gcName: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <input
                      value={contacts.gcEmail}
                      onChange={(e) => setContacts((prev) => ({ ...prev, gcEmail: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      type="email"
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Phone (optional)</span>
                    <input
                      value={contacts.gcPhone}
                      onChange={(e) => setContacts((prev) => ({ ...prev, gcPhone: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 border rounded-lg text-sm" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
                  onClick={() => {
                    setError('');
                    const validationError = validateManagedProjectScope(scope, contacts);
                    if (validationError) {
                      setError(validationError);
                      return;
                    }
                    createMutation.mutate();
                  }}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create scope & send links'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

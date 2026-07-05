'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, Link2, Mail, RefreshCw, X } from 'lucide-react';
import { api } from '@/lib/api';

type ProjectTemplate = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  defaultBudget: number;
  projectType: string;
  stages?: Array<{ name: string; estimatedCost: number; estimatedDuration: string }>;
};

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

const emptyForm = {
  name: '',
  address: '',
  budget: '',
  templateId: '',
  homeownerName: '',
  homeownerEmail: '',
  homeownerPhone: '',
  gcName: '',
  gcEmail: '',
  gcPhone: '',
};

export function CreateManagedProjectModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [createdLinks, setCreatedLinks] = useState<CreateManagedProjectResponse['links'] | null>(null);

  const templatesQuery = useQuery({
    queryKey: ['project-access-templates'],
    queryFn: () => api.get<ProjectTemplate[]>('/project-access/templates'),
    enabled: open,
  });

  const selectedTemplate = useMemo(
    () => templatesQuery.data?.find((template) => template.id === form.templateId) || null,
    [form.templateId, templatesQuery.data],
  );

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setError('');
    setCreatedLinks(null);
  }, [open]);

  useEffect(() => {
    if (selectedTemplate && !form.budget) {
      setForm((prev) => ({
        ...prev,
        budget: String(selectedTemplate.defaultBudget || ''),
      }));
    }
  }, [selectedTemplate, form.budget]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const budget = Number(form.budget || selectedTemplate?.defaultBudget || 0);
      return api.post<CreateManagedProjectResponse>('/project-access/admin/managed-projects', {
        name: form.name.trim(),
        address: form.address.trim(),
        budget,
        templateId: form.templateId,
        homeownerName: form.homeownerName.trim(),
        homeownerEmail: form.homeownerEmail.trim().toLowerCase(),
        homeownerPhone: form.homeownerPhone.trim() || undefined,
        gcName: form.gcName.trim(),
        gcEmail: form.gcEmail.trim().toLowerCase(),
        gcPhone: form.gcPhone.trim() || undefined,
      });
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
        className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Create managed project</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Admin-managed project with email-verified tracking links for homeowner and GC.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Project name</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Electricity Fix"
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Address</span>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="University of Lagos, Yaba"
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Template</span>
                  <select
                    value={form.templateId}
                    onChange={(e) => setForm((prev) => ({ ...prev, templateId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select a template</option>
                    {(templatesQuery.data || []).map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate?.description && (
                    <p className="text-xs text-gray-500">{selectedTemplate.description}</p>
                  )}
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">Budget (₦)</span>
                  <input
                    value={form.budget}
                    onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    inputMode="numeric"
                  />
                </label>
              </div>

              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Homeowner contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Full name</span>
                    <input
                      value={form.homeownerName}
                      onChange={(e) => setForm((prev) => ({ ...prev, homeownerName: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <input
                      value={form.homeownerEmail}
                      onChange={(e) => setForm((prev) => ({ ...prev, homeownerEmail: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      type="email"
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Phone (optional)</span>
                    <input
                      value={form.homeownerPhone}
                      onChange={(e) => setForm((prev) => ({ ...prev, homeownerPhone: e.target.value }))}
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
                      value={form.gcName}
                      onChange={(e) => setForm((prev) => ({ ...prev, gcName: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <input
                      value={form.gcEmail}
                      onChange={(e) => setForm((prev) => ({ ...prev, gcEmail: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      type="email"
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Phone (optional)</span>
                    <input
                      value={form.gcPhone}
                      onChange={(e) => setForm((prev) => ({ ...prev, gcPhone: e.target.value }))}
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
                    if (
                      !form.name.trim() ||
                      !form.address.trim() ||
                      !form.templateId ||
                      !form.homeownerName.trim() ||
                      !form.homeownerEmail.trim() ||
                      !form.gcName.trim() ||
                      !form.gcEmail.trim()
                    ) {
                      setError('Fill in project details, template, and both contact sections.');
                      return;
                    }
                    createMutation.mutate();
                  }}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create & send links'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

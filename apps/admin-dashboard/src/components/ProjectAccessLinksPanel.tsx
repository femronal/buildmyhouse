'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, Link2, Mail, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type AccessLink = {
  id: string;
  role: 'homeowner' | 'general_contractor';
  contactEmail: string;
  contactName?: string | null;
  emailVerifiedAt?: string | null;
  lastAccessedAt?: string | null;
  claimedUserId?: string | null;
};

type Props = {
  projectId: string;
  projectName: string;
};

export function ProjectAccessLinksPanel({ projectId, projectName }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<Record<string, string>>({});

  const linksQuery = useQuery({
    queryKey: ['project-access-links', projectId],
    queryFn: () => api.get<AccessLink[]>(`/project-access/admin/projects/${projectId}/links`),
    enabled: expanded,
  });

  const resendMutation = useMutation({
    mutationFn: (linkId: string) =>
      api.post<{ id: string; url: string; email: string; role: string }>(
        `/project-access/admin/links/${linkId}/resend`,
        {},
      ),
    onSuccess: (data) => {
      setResendResult((prev) => ({ ...prev, [data.id]: data.url }));
    },
  });

  const copyText = async (linkId: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-indigo-50/40 border-indigo-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            Managed project links
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Email-verified tracking links for {projectName}. Resend to generate a fresh link.
          </p>
        </div>
        <button
          type="button"
          className="px-3 py-2 text-sm border rounded-lg bg-white"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Hide links' : 'View links'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 pt-1">
          {linksQuery.isLoading && <p className="text-sm text-gray-500">Loading links…</p>}
          {linksQuery.isError && (
            <p className="text-sm text-red-600">Could not load project access links.</p>
          )}
          {(linksQuery.data || []).map((link) => {
            const label = link.role === 'homeowner' ? 'Homeowner' : 'General contractor';
            const latestUrl = resendResult[link.id];
            return (
              <div key={link.id} className="rounded-lg border bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 inline-flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {link.contactEmail}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {link.claimedUserId ? 'Claimed' : link.emailVerifiedAt ? 'Verified' : 'Pending'}
                  </div>
                </div>

                {latestUrl ? (
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={latestUrl}
                      className="flex-1 text-xs border rounded-lg px-3 py-2 bg-gray-50 font-mono"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 border rounded-lg text-sm inline-flex items-center gap-1"
                      onClick={() => void copyText(link.id, latestUrl)}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === link.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Link URLs are only shown when created or after resend.
                  </p>
                )}

                <button
                  type="button"
                  disabled={resendMutation.isPending}
                  className="px-3 py-2 text-sm border rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
                  onClick={() => resendMutation.mutate(link.id)}
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend link email
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Link2, Mail, RefreshCw, Sparkles } from 'lucide-react';
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

type GenerateLinksResponse = {
  projectId: string;
  projectName: string;
  links: {
    homeowner: { id: string; url: string; email: string };
    generalContractor?: { id: string; url: string; email: string } | null;
  };
  warnings?: string[];
};

type Props = {
  projectId: string;
  projectName: string;
  hasGc?: boolean;
};

export function ProjectAccessLinksPanel({ projectId, projectName, hasGc = true }: Props) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkUrls, setLinkUrls] = useState<Record<string, string>>({});
  const [panelMessage, setPanelMessage] = useState<string>('');

  const linksQuery = useQuery({
    queryKey: ['project-access-links', projectId],
    queryFn: () => api.get<AccessLink[]>(`/project-access/admin/projects/${projectId}/links`),
    enabled: expanded,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<GenerateLinksResponse>(`/project-access/admin/projects/${projectId}/generate-links`, {}),
    onSuccess: (data) => {
      const nextUrls: Record<string, string> = {
        [data.links.homeowner.id]: data.links.homeowner.url,
      };
      if (data.links.generalContractor) {
        nextUrls[data.links.generalContractor.id] = data.links.generalContractor.url;
      }
      setLinkUrls((prev) => ({ ...prev, ...nextUrls }));
      setPanelMessage(
        data.warnings?.length
          ? `Links generated. ${data.warnings.join(' ')}`
          : 'Tracking links generated and emailed to participants.',
      );
      void queryClient.invalidateQueries({ queryKey: ['project-access-links', projectId] });
    },
    onError: (error: Error) => {
      setPanelMessage(error.message || 'Could not generate tracking links.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: (linkId: string) =>
      api.post<{ id: string; url: string; email: string; role: string }>(
        `/project-access/admin/links/${linkId}/resend`,
        {},
      ),
    onSuccess: (data) => {
      setLinkUrls((prev) => ({ ...prev, [data.id]: data.url }));
      setPanelMessage('Fresh link emailed.');
    },
    onError: (error: Error) => {
      setPanelMessage(error.message || 'Could not resend link.');
    },
  });

  const copyText = async (linkId: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setPanelMessage('Could not copy to clipboard.');
    }
  };

  const links = linksQuery.data || [];
  const hasLinks = links.length > 0;

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-indigo-50/40 border-indigo-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            Project tracking links
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Email-verified links for {projectName}. Works for admin-managed and app-created projects.
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={generateMutation.isPending}
              className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={() => {
                setPanelMessage('');
                generateMutation.mutate();
              }}
            >
              <Sparkles className="w-4 h-4" />
              {hasLinks ? 'Regenerate links' : 'Generate links'}
            </button>
            {!hasGc && (
              <span className="text-xs text-amber-700 self-center">
                GC link will be skipped until a contractor is assigned.
              </span>
            )}
          </div>

          {panelMessage && (
            <p className="text-xs text-gray-600 bg-white border rounded-lg px-3 py-2">{panelMessage}</p>
          )}

          {linksQuery.isLoading && <p className="text-sm text-gray-500">Loading links…</p>}
          {linksQuery.isError && (
            <p className="text-sm text-red-600">Could not load project access links.</p>
          )}

          {!linksQuery.isLoading && !hasLinks && !generateMutation.isPending && (
            <p className="text-sm text-gray-500">No tracking links yet. Generate links to email participants.</p>
          )}

          {links.map((link) => {
            const label = link.role === 'homeowner' ? 'Homeowner' : 'General contractor';
            const latestUrl = linkUrls[link.id];
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
                    Link URLs appear here after generate or resend.
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

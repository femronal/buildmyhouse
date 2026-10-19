'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminStageEditor } from '@/components/AdminStageEditor';
import { adminProjectService } from '@/services/adminProjectService';
import { api } from '@/lib/api';

export default function AdminStageDetailPage() {
  const params = useParams();
  const projectId = String(params.id || '');
  const stageId = String(params.stageId || '');

  const projectQuery = useQuery({
    queryKey: ['admin-project', projectId],
    queryFn: () => adminProjectService.getProject(projectId),
    enabled: !!projectId,
  });

  const queryClient = useQueryClient();
  const [note, setNote] = useState('Confirmed on WhatsApp');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const project = projectQuery.data;
  const stage = project?.stages?.find((s) => s.id === stageId);
  const approveMutation = useMutation({
    mutationFn: () =>
      api.post(`/projects/${projectId}/stages/${stageId}/approve-on-behalf`, {
        note: note.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      }),
    onSuccess: async () => {
      setConfirming(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-project', projectId] });
    },
    onError: (err: any) => setError(err?.message || 'Could not approve this stage'),
  });

  if (projectQuery.isLoading) {
    return <div className="p-8 text-gray-500">Loading stage…</div>;
  }

  if (!project || !stage) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-red-600">Stage not found.</p>
        <Link href={`/projects/${projectId}`} className="text-blue-600 text-sm">
          Back to project
        </Link>
      </div>
    );
  }

  const methodLabel =
    stage.approvalMethod === 'homeowner_app'
      ? 'Homeowner in app'
      : stage.approvalMethod === 'admin_on_behalf'
        ? "Admin on homeowner's behalf"
        : stage.approvalMethod || '';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
        <p><span className="text-gray-500">Status:</span> {stage.status.replaceAll('_', ' ')}</p>
        <p><span className="text-gray-500">Submitted for approval:</span> {stage.submittedForApprovalAt ? new Date(stage.submittedForApprovalAt).toLocaleString() : '-'}</p>
        <p><span className="text-gray-500">Reminders:</span> {stage.approvalReminderCount || 0}</p>
        <p><span className="text-gray-500">Approved by:</span> {stage.approvedBy?.fullName || '-'}</p>
        <p><span className="text-gray-500">Approved at:</span> {stage.approvedAt ? new Date(stage.approvedAt).toLocaleString() : '-'}</p>
        <p><span className="text-gray-500">Method:</span> {methodLabel || '-'}</p>
        <p><span className="text-gray-500">Note:</span> {stage.approvalNote || '-'}</p>
        <p>
          <span className="text-gray-500">Screenshot:</span>{' '}
          {stage.approvalEvidenceUrl ? (
            <a href={stage.approvalEvidenceUrl} className="text-black underline" target="_blank" rel="noreferrer">Open screenshot</a>
          ) : '-'}
        </p>
      </div>
      {stage.status === 'pending_homeowner_approval' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Approve on homeowner&apos;s behalf</h2>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Confirmed on WhatsApp"
            className="w-full border rounded-lg p-3 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const uploaded = await api.uploadFile(file);
              setEvidenceUrl(uploaded.url);
            }}
            className="text-sm"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {confirming ? (
            <div className="space-y-2">
              <p className="text-sm">Approve this stage as complete on the homeowner&apos;s behalf?</p>
              <button
                type="button"
                disabled={!note.trim() || approveMutation.isPending}
                onClick={() => approveMutation.mutate()}
                className="bg-black text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              >
                Approve
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="ml-2 text-sm">Not yet</button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!note.trim()}
              onClick={() => setConfirming(true)}
              className="bg-black text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              Approve on homeowner&apos;s behalf
            </button>
          )}
        </div>
      ) : null}
      <AdminStageEditor projectId={projectId} stageId={stageId} project={project} stage={stage} />
    </div>
  );
}

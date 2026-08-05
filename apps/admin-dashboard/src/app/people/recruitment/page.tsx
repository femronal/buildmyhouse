'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Table2, Columns3 } from 'lucide-react';
import { useHrConfirm, useHrFeedback } from '@/components/people/HrDialogs';
import {
  useChangeCandidateStage,
  useCreateCandidate,
  useHireCandidate,
  useHrCandidates,
  useHrDepartments,
  useHrPositions,
  useSendHrCommunication,
  useUpdateCandidate,
} from '@/hooks/usePeopleHr';
import { api } from '@/lib/api';
import {
  CANDIDATE_STAGE_LABELS,
  PIPELINE_STAGES,
  type HrCandidate,
} from '@/lib/people/types';

type ViewMode = 'kanban' | 'table';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  departmentId: '',
  positionId: '',
  source: '',
  stage: 'screening',
  cvUrl: '',
};

export default function RecruitmentPage() {
  const { data: candidates = [], isLoading, error } = useHrCandidates();
  const { data: departments = [] } = useHrDepartments();
  const { data: positions = [] } = useHrPositions();
  const createCandidate = useCreateCandidate();
  const changeStage = useChangeCandidateStage();
  const updateCandidate = useUpdateCandidate();
  const hireCandidate = useHireCandidate();
  const sendComm = useSendHrCommunication();
  const { notify, feedbackModal } = useHrFeedback();
  const { askConfirm, confirmModal } = useHrConfirm();

  const [view, setView] = useState<ViewMode>('kanban');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const selected = useMemo(
    () => candidates.find((c) => c.id === selectedId) || null,
    [candidates, selectedId],
  );

  const salesDept = departments.find((d) => d.name === 'Sales & Partnerships');
  const pdePosition = positions.find(
    (p) => p.name === 'Partnership Development Executive',
  );

  const openAdd = () => {
    setForm({
      ...emptyForm,
      departmentId: salesDept?.id || '',
      positionId: pdePosition?.id || '',
      stage: 'screening',
    });
    setShowAdd(true);
  };

  const onUploadCv = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await api.uploadFile(file, { endpoint: '/upload/file' });
      setForm((prev) => ({ ...prev, cvUrl: uploaded.url }));
    } catch (err: any) {
      notify('error', 'CV upload failed', err?.message || 'Could not upload this file.');
    } finally {
      setUploading(false);
    }
  };

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const created = await createCandidate.mutateAsync({
        ...form,
        departmentId: form.departmentId || undefined,
        positionId: form.positionId || undefined,
        cvUrl: form.cvUrl || undefined,
      });
      setShowAdd(false);
      setSelectedId(created.id);
      setForm(emptyForm);
      notify('success', 'Candidate added', `${created.fullName} is now in the recruitment pipeline.`);
    } catch (err: any) {
      notify('error', 'Could not create candidate', err?.message || 'Please try again.');
    }
  };

  const moveStage = async (candidate: HrCandidate, stage: string) => {
    try {
      await changeStage.mutateAsync({ id: candidate.id, stage });
    } catch (err: any) {
      notify('error', 'Stage update failed', err?.message || 'Could not move this candidate.');
    }
  };

  const filteredPositions = positions.filter(
    (p) => !form.departmentId || p.departmentId === form.departmentId,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recruitment</h2>
          <p className="text-sm text-gray-500">
            Applicant tracking for internal BuildMyHouse roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
              view === 'kanban' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 shadow'
            }`}
          >
            <Columns3 className="h-4 w-4" /> Kanban
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
              view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 shadow'
            }`}
          >
            <Table2 className="h-4 w-4" /> Table
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add Candidate
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-500">Loading candidates…</p>}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">
          {(error as Error).message}
        </p>
      )}

      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage) => {
            const column = candidates.filter((c) => c.stage === stage);
            return (
              <div
                key={stage}
                className="w-72 shrink-0 rounded-xl bg-white shadow"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('text/candidate-id');
                  const candidate = candidates.find((c) => c.id === id);
                  if (candidate && candidate.stage !== stage) {
                    void moveStage(candidate, stage);
                  }
                }}
              >
                <div className="border-b px-3 py-2 text-sm font-semibold">
                  {CANDIDATE_STAGE_LABELS[stage]}{' '}
                  <span className="text-gray-400">({column.length})</span>
                </div>
                <div className="space-y-2 p-2">
                  {column.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData('text/candidate-id', candidate.id)
                      }
                      onClick={() => setSelectedId(candidate.id)}
                      className={`w-full rounded-lg border p-3 text-left text-sm hover:border-blue-400 ${
                        selectedId === candidate.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{candidate.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {candidate.position?.name || 'No position'}
                      </p>
                      <p className="text-xs text-gray-400">{candidate.email}</p>
                    </button>
                  ))}
                  {column.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-gray-400">Drop here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedId(candidate.id)}
                >
                  <td className="px-4 py-3 font-medium">{candidate.fullName}</td>
                  <td className="px-4 py-3">{candidate.position?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {CANDIDATE_STAGE_LABELS[candidate.stage] || candidate.stage}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(candidate.applicationDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <CandidateDrawer
          candidate={selected}
          onClose={() => setSelectedId(null)}
          onStage={(stage) => void moveStage(selected, stage)}
          onSave={async (payload) => {
            try {
              await updateCandidate.mutateAsync({ id: selected.id, payload });
              notify('success', 'Candidate updated', 'Notes and scores were saved.');
            } catch (err: any) {
              notify('error', 'Update failed', err?.message || 'Could not save candidate changes.');
            }
          }}
          onSend={async (templateKey) => {
            try {
              await sendComm.mutateAsync({
                templateKey,
                recipientEmail: selected.email,
                candidateId: selected.id,
                name: selected.firstName,
                position: selected.position?.name || 'the role',
              });
              notify('success', 'Email sent', 'The message was queued or delivered via Resend.');
            } catch (err: any) {
              notify('error', 'Send failed', err?.message || 'Could not send this email.');
            }
          }}
          onHire={() => {
            askConfirm({
              title: 'Hire candidate',
              message: `Hire ${selected.fullName} and create a staff profile with onboarding checklist?`,
              confirmLabel: 'Hire candidate',
              onConfirm: async () => {
                try {
                  const staff = await hireCandidate.mutateAsync({
                    id: selected.id,
                    payload: { workforceType: 'fixed_term' },
                  });
                  notify(
                    'success',
                    'Candidate hired',
                    `${selected.fullName} now has a staff profile. Opening it…`,
                  );
                  window.setTimeout(() => {
                    window.location.href = `/people/directory/${staff.id}`;
                  }, 600);
                } catch (err: any) {
                  notify('error', 'Hire failed', err?.message || 'Could not hire this candidate.');
                  throw err;
                }
              },
            });
          }}
        />
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onCreate}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold">Add Candidate</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['firstName', 'First name'],
                  ['lastName', 'Last name'],
                  ['email', 'Email'],
                  ['phone', 'Phone'],
                  ['location', 'Location'],
                  ['source', 'Source'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-sm">
                  <span className="text-gray-600">{label}</span>
                  <input
                    required={key === 'firstName' || key === 'lastName' || key === 'email'}
                    type={key === 'email' ? 'email' : 'text'}
                    value={form[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
              ))}
              <label className="text-sm sm:col-span-2">
                <span className="text-gray-600">Department</span>
                <select
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, departmentId: e.target.value, positionId: '' }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="text-gray-600">Position</span>
                <select
                  value={form.positionId}
                  onChange={(e) => setForm((prev) => ({ ...prev, positionId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Select position</option>
                  {filteredPositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-gray-600">Stage</span>
                <select
                  value={form.stage}
                  onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  {Object.entries(CANDIDATE_STAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-gray-600">CV</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="mt-1 w-full text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUploadCv(file);
                  }}
                />
                {uploading && <p className="text-xs text-gray-500">Uploading…</p>}
                {form.cvUrl && (
                  <a href={form.cvUrl} className="text-xs text-blue-600" target="_blank" rel="noreferrer">
                    CV uploaded
                  </a>
                )}
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCandidate.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {createCandidate.isPending ? 'Saving…' : 'Create candidate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {feedbackModal}
      {confirmModal}
    </div>
  );
}

function CandidateDrawer({
  candidate,
  onClose,
  onStage,
  onSave,
  onSend,
  onHire,
}: {
  candidate: HrCandidate;
  onClose: () => void;
  onStage: (stage: string) => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onSend: (templateKey: string) => Promise<void>;
  onHire: () => void;
}) {
  const [interviewNotes, setInterviewNotes] = useState(candidate.interviewNotes || '');
  const [interviewScore, setInterviewScore] = useState(
    candidate.interviewScore?.toString() || '',
  );
  const [assessmentScore, setAssessmentScore] = useState(
    candidate.assessmentScore?.toString() || '',
  );
  const [pilotNotes, setPilotNotes] = useState(candidate.pilotNotes || '');
  const [offerDetails, setOfferDetails] = useState(candidate.offerDetails || '');

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l bg-white shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <h3 className="font-semibold text-gray-900">{candidate.fullName}</h3>
          <p className="text-xs text-gray-500">{candidate.email}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-gray-500">
          Close
        </button>
      </div>
      <div className="space-y-4 p-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Position</p>
          <p className="font-medium">{candidate.position?.name || '—'}</p>
          <p className="text-gray-500">{candidate.department?.name || '—'}</p>
        </div>
        <label className="block">
          <span className="text-xs text-gray-500">Stage</span>
          <select
            value={candidate.stage}
            onChange={(e) => onStage(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {Object.entries(CANDIDATE_STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {candidate.cvUrl && (
          <a
            href={candidate.cvUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-blue-600 hover:underline"
          >
            View CV
          </a>
        )}
        <div className="space-y-2">
          <p className="font-medium">Interview</p>
          <textarea
            value={interviewNotes}
            onChange={(e) => setInterviewNotes(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            rows={3}
            placeholder="Interview notes"
          />
          <input
            value={interviewScore}
            onChange={(e) => setInterviewScore(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Interview score"
          />
        </div>
        <div className="space-y-2">
          <p className="font-medium">Assessment / Pilot / Offer</p>
          <input
            value={assessmentScore}
            onChange={(e) => setAssessmentScore(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Assessment score"
          />
          <textarea
            value={pilotNotes}
            onChange={(e) => setPilotNotes(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            rows={2}
            placeholder="Pilot notes"
          />
          <textarea
            value={offerDetails}
            onChange={(e) => setOfferDetails(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            rows={2}
            placeholder="Offer details"
          />
          <button
            type="button"
            className="rounded-lg bg-gray-900 px-3 py-2 text-white"
            onClick={() =>
              void onSave({
                interviewNotes,
                interviewScore: interviewScore ? Number(interviewScore) : null,
                assessmentScore: assessmentScore ? Number(assessmentScore) : null,
                pilotNotes,
                offerDetails,
              })
            }
          >
            Save notes & scores
          </button>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Send email</p>
          <div className="flex flex-wrap gap-2">
            {[
              'interview_invitation',
              'assessment_invitation',
              'paid_pilot_invitation',
              'offer',
              'rejection',
            ].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => void onSend(key)}
                className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
              >
                {key.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        {candidate.stage !== 'hired' && !candidate.hiredStaff && (
          <button
            type="button"
            onClick={onHire}
            className="w-full rounded-lg bg-blue-600 px-3 py-2 font-medium text-white"
          >
            Mark hired → create staff profile
          </button>
        )}
        {candidate.hiredStaff && (
          <Link
            href={`/people/directory/${candidate.hiredStaff.id}`}
            className="block text-center text-blue-600 hover:underline"
          >
            Open staff profile
          </Link>
        )}
      </div>
    </div>
  );
}

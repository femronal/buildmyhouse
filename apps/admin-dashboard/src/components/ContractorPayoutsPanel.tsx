'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProjectService, type AdminProjectStage } from '@/services/adminProjectService';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import { friendlyUploadError } from '@/lib/upload-rules';

function naira(amount: number) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function lagosToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function labelDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function sentAtIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  if (value === lagosToday()) return new Date().toISOString();
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

function lineAmount(row: { totalPrice?: number | null; quantity?: number | null; unitPrice?: number | null }) {
  const total = Number(row.totalPrice);
  if (Number.isFinite(total) && total > 0) return total;
  const quantity = Number(row.quantity);
  const unitPrice = Number(row.unitPrice);
  if (Number.isFinite(quantity) && Number.isFinite(unitPrice) && quantity * unitPrice > 0) return quantity * unitPrice;
  return 0;
}

function stageApproved(stage: AdminProjectStage) {
  return stage.status === 'completed' && Boolean(stage.approvedAt);
}

export function ContractorPayoutsPanel({
  projectId,
  stageId,
  stage,
  gcName,
}: {
  projectId: string;
  stageId: string;
  stage: AdminProjectStage;
  gcName?: string | null;
}) {
  const queryClient = useQueryClient();
  const payouts = stage.contractorPayouts || [];
  const sent = payouts.filter((row) => !row.voidedAt).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const stageAmount = Number(stage.estimatedCost || 0);
  const left = Math.max(0, stageAmount - sent);
  const approved = stageApproved(stage);
  const artisanPaid = (stage.materials || [])
    .filter((row) => row.payeeKind === 'artisan' && row.status === 'paid')
    .reduce((sum, row) => sum + lineAmount(row), 0);
  const contractorName = gcName?.trim() || 'Not set';
  const [amount, setAmount] = useState('');
  const [sentOn, setSentOn] = useState(lagosToday);
  const [bankReference, setBankReference] = useState('');
  const [proofFileUrl, setProofFileUrl] = useState('');
  const [earlyPaymentReason, setEarlyPaymentReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => adminProjectService.recordContractorPayout(projectId, stageId, {
      amount: Number(amount),
      bankReference: bankReference.trim(),
      proofFileUrl,
      sentAt: sentIso,
      earlyPaymentReason: approved ? undefined : earlyPaymentReason.trim(),
    }),
    onSuccess: async () => {
      setConfirming(false);
      setAmount('');
      setBankReference('');
      setProofFileUrl('');
      setEarlyPaymentReason('');
      setSentOn(lagosToday());
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['admin-project', projectId] });
    },
    onError: (saveError: Error) => setError(saveError.message || 'Could not save the payment record'),
  });

  const voidMutation = useMutation({
    mutationFn: () => adminProjectService.voidContractorPayout(projectId, voidingId || '', voidReason.trim()),
    onSuccess: async () => {
      setVoidingId(null);
      setVoidReason('');
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['admin-project', projectId] });
    },
    onError: (voidError: Error) => setError(voidError.message || 'Could not void the payment record'),
  });

  const reasonReady = approved || earlyPaymentReason.trim().length >= 10;
  const sentIso = sentAtIso(sentOn);
  const formReady = Number(amount) > 0 && Boolean(bankReference.trim()) && Boolean(proofFileUrl) && Boolean(sentIso) && reasonReady && !uploading;

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-950">Money sent to the contractor</h2>
      <div className="text-sm text-gray-700 space-y-1">
        <p>Stage contractor amount: {naira(stageAmount)}</p>
        <p>Sent so far: {naira(sent)}</p>
        <p>Left to send for this stage: {naira(left)}</p>
      </div>
      {payouts.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2 pr-3">Date sent</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">GC</th>
                <th className="py-2 pr-3">Bank reference</th>
                <th className="py-2 pr-3">Bank</th>
                <th className="py-2 pr-3">Receipt</th>
                <th className="py-2 pr-3">Sent by</th>
                <th className="py-2 pr-3">Note</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {payouts.map((row) => (
                <tr key={row.id} className={row.voidedAt ? 'text-gray-400' : 'text-gray-900'}>
                  <td className="py-2 pr-3">{row.sentAt ? new Date(row.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</td>
                  <td className="py-2 pr-3">{naira(row.amount)}</td>
                  <td className="py-2 pr-3">{row.gcName || 'Not set'}</td>
                  <td className="py-2 pr-3">{row.bankReference}</td>
                  <td className="py-2 pr-3">{row.bankLabel || 'Not set'}</td>
                  <td className="py-2 pr-3">
                    {row.proofFileUrl ? (
                      <a href={getBackendAssetUrl(row.proofFileUrl) || row.proofFileUrl} target="_blank" rel="noreferrer" className="underline">Open receipt</a>
                    ) : 'Not set'}
                  </td>
                  <td className="py-2 pr-3">{row.sentBy?.fullName || 'Not set'}</td>
                  <td className="py-2 pr-3">
                    {row.voidedAt ? `Voided by ${row.voidedBy?.fullName || 'Not set'}: ${row.voidReason || 'Not set'}` : row.earlyPaymentReason || ''}
                  </td>
                  <td className="py-2">
                    {!row.voidedAt ? (
                      <button type="button" className="min-h-11 text-sm underline" onClick={() => { setVoidingId(row.id); setVoidReason(''); setError(''); }}>Void</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {voidingId ? (
        <div className="space-y-2 rounded-lg border border-gray-200 p-3">
          <p className="text-sm">Void this record?</p>
          <textarea
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
            placeholder="Write why this record is wrong"
            className="w-full rounded-lg border p-3 text-sm"
          />
          <button
            type="button"
            disabled={voidReason.trim().length < 10 || voidMutation.isPending}
            onClick={() => voidMutation.mutate()}
            className="min-h-11 rounded-lg bg-red-600 px-4 text-sm text-white disabled:opacity-50"
          >
            Void record
          </button>
          <button type="button" className="ml-2 min-h-11 text-sm" onClick={() => setVoidingId(null)}>Not yet</button>
        </div>
      ) : null}
      <form
        className="space-y-3 border-t border-gray-100 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!confirming) {
            setConfirming(true);
            return;
          }
          setError('');
          saveMutation.mutate();
        }}
      >
        <h3 className="font-medium text-gray-950">Record a payment to the contractor</h3>
        <p className="text-sm text-gray-600">Bank transfer</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            Amount
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setConfirming(false); }} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">
            Date sent
            <input type="date" value={sentOn} max={lagosToday()} onChange={(event) => { setSentOn(event.target.value); setConfirming(false); }} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700 md:col-span-2">
            Bank reference
            <input value={bankReference} onChange={(event) => { setBankReference(event.target.value); setConfirming(false); }} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <label className="block text-sm text-gray-700">
          Transfer receipt
          <input
            type="file"
            accept="image/*,.pdf"
            disabled={uploading}
            className="mt-1 block text-sm"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setError('');
              setConfirming(false);
              try {
                const uploaded = await api.uploadFile(file, { endpoint: '/upload/document' });
                const absolute = getBackendAssetUrl(uploaded.url) || uploaded.url;
                if (!absolute.startsWith('https://')) {
                  setProofFileUrl('');
                  setError('Upload the transfer receipt.');
                  return;
                }
                setProofFileUrl(absolute);
              } catch (uploadError) {
                setProofFileUrl('');
                setError(friendlyUploadError(uploadError));
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        {uploading ? <p className="text-sm text-gray-500">Uploading...</p> : null}
        {proofFileUrl ? <p className="text-sm text-gray-600">Receipt uploaded.</p> : null}
        {!approved ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">The homeowner has not approved this stage yet. Write why you are paying now.</p>
            <textarea
              value={earlyPaymentReason}
              onChange={(event) => { setEarlyPaymentReason(event.target.value); setConfirming(false); }}
              className="w-full rounded-lg border p-3 text-sm"
            />
          </div>
        ) : null}
        {artisanPaid > 0 ? (
          <p className="text-sm text-amber-800">This stage already has {naira(artisanPaid)} of artisan lines marked paid. Do not record the same money twice.</p>
        ) : null}
        {confirming ? (
          <p className="text-sm text-gray-800">Record {naira(Number(amount))} sent to {contractorName} on {labelDate(sentOn)}, ref {bankReference.trim()}?</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={!formReady || saveMutation.isPending} className="min-h-11 rounded-lg bg-gray-950 px-4 text-sm text-white disabled:opacity-50">
            {confirming ? 'Save' : 'Save payment record'}
          </button>
          {confirming ? (
            <button type="button" className="min-h-11 text-sm" onClick={() => setConfirming(false)}>Not yet</button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

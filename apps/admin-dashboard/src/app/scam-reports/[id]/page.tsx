'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { useScamReport, useUpdateScamReport, type ScamReportStatus } from '@/hooks/useScamReports';

const STATUSES: ScamReportStatus[] = ['new', 'investigating', 'upheld', 'dismissed'];

export default function ScamReportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id || '');
  const query = useScamReport(id);
  const save = useUpdateScamReport(id);
  const report = query.data;
  const [status, setStatus] = useState<ScamReportStatus>('new');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!report) return;
    setStatus(report.status);
    setNotes(report.adminNotes || '');
    setNotice(report.publicNotice || '');
  }, [report]);

  const persist = async (extra: Record<string, unknown> = {}) => {
    setError('');
    setSaved('');
    try {
      await save.mutateAsync({
        status,
        adminNotes: notes,
        publicNotice: notice,
        ...extra,
      });
      setSaved('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this report.');
    }
  };

  if (query.isLoading) return <div className="p-4 md:p-8 text-sm text-gray-500">Loading report...</div>;
  if (!report) return <div className="p-4 md:p-8 text-sm text-gray-700">This report was not found.</div>;

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-3xl">
      <Link href="/scam-reports" className="text-sm underline">Back to reports</Link>
      <h1 className="text-2xl font-bold font-poppins">{report.listingName}</h1>
      <p className="text-sm capitalize text-gray-500">{report.listingKind}, {report.status}</p>
      <a className="text-sm underline" href={`https://buildmyhouse.app${report.listingPath}`} target="_blank" rel="noreferrer">Open public listing</a>

      <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
        <h2 className="font-semibold">Reporter</h2>
        <p>{report.reporter.name}</p>
        <p>{report.reporter.email || 'No email'}</p>
        <p>{report.reporter.phone || report.contactPhone || 'No phone'}</p>
        <p>Amount in naira: {report.amountNaira == null ? 'Not stated' : report.amountNaira.toLocaleString('en-NG')}</p>
        <p>Date: {report.incidentDate ? new Date(report.incidentDate).toLocaleDateString('en-GB') : 'Not stated'}</p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">What happened</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{report.whatHappened}</p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Evidence</h2>
        {report.evidenceUrls.length === 0 ? <p className="mt-2 text-sm text-gray-500">No files attached.</p> : null}
        <ul className="mt-2 space-y-1">
          {report.evidenceUrls.map((url) => (
            <li key={url}><a className="text-sm underline break-all" href={url} target="_blank" rel="noreferrer">{url}</a></li>
          ))}
        </ul>
      </section>

      {report.otherReports.length ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">Other reports on this listing</h2>
          <ul className="mt-2 space-y-2">
            {report.otherReports.map((other) => (
              <li key={other.id}>
                <Link href={`/scam-reports/${other.id}`} className="text-sm underline capitalize">{other.status}</Link>
                <span className="text-sm text-gray-500"> {new Date(other.createdAt).toLocaleDateString('en-GB')}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <label className="block text-sm font-medium">Private notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-gray-300 p-3" />
      </label>

      <label className="block text-sm font-medium">Status
        <select value={status} onChange={(event) => setStatus(event.target.value as ScamReportStatus)} className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3">
          {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label className="block text-sm font-medium">Public notice
        <textarea value={notice} onChange={(event) => setNotice(event.target.value)} maxLength={500} className="mt-1 min-h-24 w-full rounded-lg border border-gray-300 p-3" />
      </label>
      <p className="text-sm text-gray-600">This text will show on the public listing.</p>
      {status === 'upheld' && notice.trim().length < 20 ? <p className="text-sm text-red-700">A public notice of at least 20 characters is required to uphold this report.</p> : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {saved ? <p className="text-sm text-gray-700">{saved}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg border border-gray-300 px-4"
          onClick={async () => {
            const me = await getCurrentUser();
            if (!me?.id) {
              setError('Sign in again before assigning this report.');
              return;
            }
            await persist({ assignedAdminId: me.id });
          }}
        >
          Assign to me
        </button>
        <button type="button" className="min-h-11 rounded-lg bg-gray-950 px-4 text-white" disabled={save.isPending} onClick={() => persist()}>
          {save.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

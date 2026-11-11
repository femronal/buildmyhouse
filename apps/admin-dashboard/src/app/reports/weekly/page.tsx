'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { useWeeklyReport, type ReportLine, type WeeklyReport } from '@/hooks/useWeeklyReport';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + days));
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function mondayOnOrBefore(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  const weekday = date.getUTCDay();
  const back = weekday === 0 ? 6 : weekday - 1;
  return addDays(iso, -back);
}

function label(iso: string, withYear = false): string {
  const [year, month, day] = iso.split('-').map(Number);
  const text = `${day} ${MONTHS[(month || 1) - 1]}`;
  return withYear ? `${text} ${year}` : text;
}

function weekHasEnded(weekStart: string, now = new Date()): boolean {
  const [year, month, day] = weekStart.split('-').map(Number);
  const start = Date.UTC(year, (month || 1) - 1, day || 1) - 60 * 60 * 1000;
  return start + 7 * 24 * 60 * 60 * 1000 - 1 <= now.getTime();
}

function naira(value: number): string {
  return `₦${value.toLocaleString('en-NG')}`;
}

function shownValue(row: ReportLine): string {
  if (row.status === 'not_tracked') return row.note || 'Not tracked yet';
  if (row.value == null) return row.note || '';
  if (row.unit === 'naira') return naira(row.value);
  return String(row.value);
}

function ReportBody({ week }: { week?: string }) {
  const router = useRouter();
  const report = useWeeklyReport(week);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  function openWeek(next: string) {
    router.push(`/reports/weekly?week=${mondayOnOrBefore(next)}`);
  }

  async function downloadCsv(current: WeeklyReport) {
    setDownloading(true);
    setDownloadError('');
    try {
      const body = await api.get<{ filename: string; csv: string }>(`/admin/reports/weekly/csv?week=${current.weekStart}`);
      const blob = new Blob([body.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = body.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'The CSV could not be downloaded.');
    } finally {
      setDownloading(false);
    }
  }

  if (report.isLoading) {
    return <div className="p-4 md:p-8 text-sm text-gray-600">Loading the weekly report.</div>;
  }
  if (report.isError || !report.data) {
    const message = report.error instanceof Error ? report.error.message : 'The weekly report could not be loaded.';
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-semibold text-gray-950">Weekly report</h1>
        <p className="mt-2 text-sm text-gray-700">{message}</p>
        <Link href="/reports/weekly" className="mt-3 inline-block text-sm font-medium text-gray-950 underline">Open the latest finished week</Link>
      </div>
    );
  }

  const data = report.data;
  const nextWeek = addDays(data.weekStart, 7);
  const nextDisabled = !weekHasEnded(nextWeek);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Weekly report</h1>
          <p className="mt-1 text-sm text-gray-600">Mon {label(data.weekStart)} to Sun {label(data.weekEnd, true)}, Lagos time</p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="rounded-full bg-gray-950 px-4 py-2 text-sm font-medium text-white">Download PDF</button>
          <button type="button" onClick={() => downloadCsv(data)} disabled={downloading} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-950">Download CSV</button>
        </div>
        {downloadError ? <p className="no-print mt-2 text-sm text-gray-700">{downloadError}</p> : null}
      </div>

      <div className="no-print mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => openWeek(addDays(data.weekStart, -7))} className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm">Previous week</button>
        <button type="button" onClick={() => openWeek(nextWeek)} disabled={nextDisabled} className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm disabled:text-gray-400">Next week</button>
        <input
          aria-label="Week"
          type="date"
          value={data.weekStart}
          onChange={(event) => {
            if (event.target.value) openWeek(event.target.value);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-6 space-y-4">
        {data.sections.map((section) => (
          <section key={section.key} className="report-section rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-950">{section.title}</h2>
            <div className="mt-3 divide-y divide-gray-100">
              {section.lines.map((row) => (
                <div key={row.key} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <div>
                    <p className="text-sm text-gray-800">{row.label}</p>
                    {row.status !== 'not_tracked' && row.note ? <p className="text-xs text-gray-500">{row.note}</p> : null}
                    {row.previous != null ? <p className="text-xs text-gray-400">Previous week {row.unit === 'naira' ? naira(row.previous) : row.previous}</p> : null}
                  </div>
                  <p className={`text-sm font-medium ${row.status === 'not_tracked' ? 'text-gray-500' : 'text-gray-950'}`}>{shownValue(row)}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="report-section mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-950">Jobs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[64rem] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500">
                <th className="py-2 pr-3">Job</th>
                <th className="py-2 pr-3">Homeowner</th>
                <th className="py-2 pr-3">GC</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Money in</th>
                <th className="py-2 pr-3">Sent to contractor</th>
                <th className="py-2 pr-3">Still with BuildMyHouse</th>
                <th className="py-2">Disputes</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((job) => (
                <tr key={job.projectId} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{job.name}</td>
                  <td className="py-2 pr-3">{job.homeownerName || ''}</td>
                  <td className="py-2 pr-3">{job.gcName || ''}</td>
                  <td className="py-2 pr-3">{job.dormant ? 'Dormant' : job.status}</td>
                  <td className="py-2 pr-3">{naira(job.moneyIn)}</td>
                  <td className="py-2 pr-3">{naira(job.sentToContractor)}</td>
                  <td className="py-2 pr-3">{naira(job.stillWithBuildMyHouse)}</td>
                  <td className="py-2">{job.openDisputes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="print-only mt-6 text-xs text-gray-500">Generated {new Date(data.generatedAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })} Lagos time</p>
    </div>
  );
}

export default function WeeklyReportPage() {
  return (
    <Suspense fallback={<div className="p-4 md:p-8 text-sm text-gray-600">Loading the weekly report.</div>}>
      <WeeklyReportSearch />
    </Suspense>
  );
}

function WeeklyReportSearch() {
  const search = useSearchParams();
  const week = search.get('week') || undefined;
  return <ReportBody week={week} />;
}

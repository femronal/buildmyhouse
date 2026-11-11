import Link from 'next/link';
import { ageLabel, attentionPill, formatNaira, photoNote } from './format';
import type { LiveJob } from '@/hooks/useAdminDashboard';

export default function LiveJobs({ jobs }: { jobs: LiveJob[] }) {
  return (
    <section id="jobs" className="rounded-2xl border border-gray-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-950">Live jobs</h2>
        <p className="text-xs text-gray-400">Active, not archived, not dormant</p>
      </header>
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">Job</th>
              <th className="px-4 py-2 font-medium">Stage</th>
              <th className="px-4 py-2 font-medium">Money</th>
              <th className="px-4 py-2 font-medium">Last update</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t border-gray-100 align-top">
                <td className="px-4 py-3"><JobCell job={job} /></td>
                <td className="px-4 py-3"><StageCell job={job} /></td>
                <td className="px-4 py-3"><MoneyCell job={job} /></td>
                <td className="px-4 py-3"><UpdateCell job={job} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-gray-100 md:hidden">
        {jobs.map((job) => (
          <article key={job.id} className="min-h-14 px-4 py-3">
            <JobCell job={job} />
            <div className="mt-2"><StageCell job={job} /></div>
            <div className="mt-2"><MoneyCell job={job} /></div>
            <div className="mt-2"><UpdateCell job={job} /></div>
          </article>
        ))}
      </div>
      <div className="border-t border-gray-100 px-4 py-3">
        <Link href="/projects" className="inline-flex min-h-11 items-center text-sm font-medium text-green-700">All projects</Link>
      </div>
    </section>
  );
}

function JobCell({ job }: { job: LiveJob }) {
  return (
    <div>
      <Link href={job.href} className="font-medium text-gray-950">{job.name}</Link>
      <p className="text-xs text-gray-500">
        {[job.homeownerName ? `HO: ${job.homeownerName}` : null, job.gcName ? `GC: ${job.gcName}` : null].filter(Boolean).join(' · ')}
      </p>
    </div>
  );
}

function StageCell({ job }: { job: LiveJob }) {
  const pill = attentionPill(job);
  const stage = job.stageNumber && job.stageCount ? `${job.stageNumber} of ${job.stageCount}${job.stageName ? ` ${job.stageName}` : ''}` : job.stageName || 'No stage';
  const tone = pill.tone === 'red' ? 'bg-red-50 text-red-700' : pill.tone === 'amber' ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-600';
  return (
    <div>
      <p className="text-gray-800">{stage}</p>
      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{pill.text}</span>
    </div>
  );
}

function MoneyCell({ job }: { job: LiveJob }) {
  const width = job.fullJobPrice > 0 ? Math.max(0, Math.min(100, (job.moneyMoved / job.fullJobPrice) * 100)) : 0;
  return (
    <div>
      <p className="text-gray-800">
        <span className="md:hidden">{formatNaira(job.moneyMoved, true)} of {formatNaira(job.fullJobPrice, true)} moved</span>
        <span className="hidden md:inline">{formatNaira(job.moneyMoved)} of {formatNaira(job.fullJobPrice)} moved</span>
      </p>
      <div className="mt-1 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-green-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function UpdateCell({ job }: { job: LiveJob }) {
  const note = photoNote(job.photos);
  return (
    <div>
      <p className="text-gray-800">{ageLabel(job.lastActivityAt)}</p>
      {note ? <p className="text-xs text-gray-500">{note}</p> : null}
    </div>
  );
}

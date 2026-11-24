'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import ImportDialog from '@/components/partnerships/ImportDialog';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { usePartnershipLeads } from '@/hooks/usePartnerships';
import { CATEGORY_LABEL, STAGE_LABEL, STATUS_LABEL, formatLagosDayDate, statusChipClass } from '@/lib/partnerships';

export default function PartnershipLeadsPage() {
  const params = useSearchParams();
  const { hasPermission } = useMyPermissions();
  const [importing, setImporting] = useState(false);
  const filters = {
    q: params.get('q') || undefined,
    stage: params.get('stage') || undefined,
    status: params.get('status') || undefined,
    category: params.get('category') || undefined,
    ownerId: params.get('ownerId') || undefined,
  };
  const leads = usePartnershipLeads(filters);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Filter name="stage" label="Stage" value={filters.stage || ''} options={STAGE_LABEL} />
        <Filter name="status" label="Status" value={filters.status || ''} options={{ ...STATUS_LABEL, action: 'Action required', dormant_or_closed: 'Dormant and closed' }} />
        {hasPermission('partnerships.manage') ? <button type="button" onClick={() => setImporting(true)} className="min-h-11 rounded-full border bg-white px-4 text-sm">Import from sheet</button> : null}
      </div>
      {leads.data && leads.data.length === 0 ? <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700">No partner leads yet. Add the first one.</p> : null}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b text-xs uppercase text-gray-500"><th className="px-3 py-2">Ref</th><th>Company</th><th>Category</th><th>Stage</th><th>Status</th><th>Owner</th><th>Last contact</th><th>Due</th></tr></thead>
          <tbody>
            {(leads.data || []).map((lead) => <LeadCells key={lead.id} lead={lead} />)}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {(leads.data || []).map((lead) => (
          <Link key={lead.id} href={`/growth/partnerships/leads/${lead.id}`} className="block rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{lead.leadRef}</p>
            <p className="font-semibold text-gray-950">{lead.companyName}</p>
            {lead.groupName ? <p className="text-sm text-gray-600">Group: {lead.groupName}</p> : null}
            <p className="mt-1 text-sm text-gray-600">{CATEGORY_LABEL[lead.category]} · {STAGE_LABEL[lead.stage]}</p>
            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs ${statusChipClass(lead.followUpStatus)}`}>{STATUS_LABEL[lead.followUpStatus]}</span>
            {lead.nurtureCheckDue ? <p className="mt-2 text-sm text-gray-700">Nurture check due</p> : null}
          </Link>
        ))}
      </div>
      {importing ? <ImportDialog onClose={() => setImporting(false)} /> : null}
    </div>
  );
}

function Filter({ name, label, value, options }: { name: string; label: string; value: string; options: Record<string, string> }) {
  const params = useSearchParams();
  const router = useRouter();
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) next.set(name, event.target.value);
        else next.delete(name);
        const text = next.toString();
        router.replace(text ? `/growth/partnerships/leads?${text}` : '/growth/partnerships/leads');
      }}
      className="min-h-11 rounded-full border bg-white px-3 text-sm"
    >
      <option value="">{label}: All</option>
      {Object.entries(options).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  );
}

function LeadCells({ lead }: { lead: any }) {
  return (
    <tr className="border-b">
      <td className="px-3 py-2">{lead.leadRef}</td>
      <td><Link href={`/growth/partnerships/leads/${lead.id}`} className="font-medium text-gray-950">{lead.companyName}</Link>{lead.groupName ? <p className="text-xs text-gray-500">Group: {lead.groupName}</p> : null}{lead.nurtureCheckDue ? <p className="text-xs text-gray-700">Nurture check due</p> : null}</td>
      <td>{CATEGORY_LABEL[lead.category] || lead.category}</td>
      <td>{STAGE_LABEL[lead.stage] || lead.stage}</td>
      <td><span className={`rounded-full px-2 py-0.5 text-xs ${statusChipClass(lead.followUpStatus)}`}>{STATUS_LABEL[lead.followUpStatus]}</span></td>
      <td>{lead.owner?.fullName || 'Not set'}</td>
      <td>{lead.daysSinceLastContact == null ? 'Never contacted' : `${lead.daysSinceLastContact} days ago`}</td>
      <td>{lead.effectiveDueIso ? formatLagosDayDate(`${lead.effectiveDueIso}T12:00:00+01:00`) : 'No date set'}</td>
    </tr>
  );
}

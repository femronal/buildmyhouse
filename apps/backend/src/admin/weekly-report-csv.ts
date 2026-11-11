import type { WeeklyReport, WeeklyReportJob } from './weekly-report.service';

const JOB_FIELDS: Array<keyof WeeklyReportJob> = [
  'projectId',
  'name',
  'homeownerName',
  'gcName',
  'status',
  'dormant',
  'stagesApproved',
  'photosAdded',
  'photosOnSite',
  'photosReused',
  'moneyIn',
  'sentToContractor',
  'paidToShopsForMaterials',
  'paidToTeamMembers',
  'invoicedNotPaid',
  'stillWithBuildMyHouse',
  'openDisputes',
];

function quote(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toWeeklyReportCsv(report: WeeklyReport): string {
  const rows = [JOB_FIELDS.join(',')];
  for (const job of report.jobs) {
    rows.push(JOB_FIELDS.map((field) => quote(job[field])).join(','));
  }
  rows.push('');
  rows.push(['section', 'line', 'value', 'status', 'note'].join(','));
  for (const section of report.sections) {
    for (const line of section.lines) {
      rows.push([section.key, line.label, line.value ?? '', line.status, line.note ?? ''].map((value) => quote(value)).join(','));
    }
  }
  return rows.join('\n');
}

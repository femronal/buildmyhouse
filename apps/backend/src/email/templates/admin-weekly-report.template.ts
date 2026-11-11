import { WeeklyReport } from '../../admin/weekly-report.service';
import { lagosShortLabel } from '../../admin/lagos-week';

const SUMMARY_KEYS = [
  'live_jobs',
  'stages_approved',
  'money_in',
  'invoiced_not_paid',
  'disputes_open_at_week_end',
  'dormant_jobs',
];

export function buildAdminWeeklyReportEmail(input: {
  report: WeeklyReport;
  reportUrl: string;
  recipientName?: string | null;
}): { subject: string; html: string; text: string } {
  const start = lagosShortLabel(input.report.weekStart);
  const end = lagosShortLabel(input.report.weekEnd, true);
  const subject = `BuildMyHouse weekly report, ${start} to ${end}`;
  const lines = input.report.sections.flatMap((section) => section.lines).filter((line) => SUMMARY_KEYS.includes(line.key));
  const ordered = SUMMARY_KEYS.map((key) => lines.find((line) => line.key === key)).filter((line): line is NonNullable<typeof line> => Boolean(line));
  const textLines = ordered.map((line) => `${line.label}: ${line.status === 'not_tracked' ? line.note || 'Not tracked yet' : line.value ?? ''}`);
  const greeting = input.recipientName?.trim() ? `Hello ${input.recipientName.trim()},` : 'Hello,';
  const text = [greeting, '', ...textLines, '', input.reportUrl].join('\n');
  const htmlRows = ordered
    .map((line) => `<p style="margin:0 0 8px;font:16px/1.4 sans-serif;color:#111">${line.label}: ${line.status === 'not_tracked' ? line.note || 'Not tracked yet' : line.value ?? ''}</p>`)
    .join('');
  const html = [
    `<p style="margin:0 0 16px;font:16px/1.4 sans-serif;color:#111">${greeting}</p>`,
    htmlRows,
    `<p style="margin:16px 0"><a href="${input.reportUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font:14px sans-serif">Open the weekly report</a></p>`,
    `<p style="margin:0;font:14px/1.4 sans-serif;color:#444">${input.reportUrl}</p>`,
  ].join('');
  return { subject, html, text };
}

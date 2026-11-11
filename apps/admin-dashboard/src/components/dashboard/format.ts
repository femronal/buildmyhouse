import type { AttentionReason, LiveJob } from '@/hooks/useAdminDashboard';

export function formatNaira(amount: number, compact = false): string {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  if (!compact) return `₦${safe.toLocaleString('en-NG')}`;
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const text = millions >= 10 ? String(Math.round(millions)) : trimNumber(millions.toFixed(1));
    return `${sign}₦${text}m`;
  }
  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    const text = thousands >= 10 ? String(Math.round(thousands)) : trimNumber(thousands.toFixed(1));
    return `${sign}₦${text}k`;
  }
  return `${sign}₦${abs.toLocaleString('en-NG')}`;
}

function trimNumber(value: string): string {
  return value.replace(/\.0$/, '');
}

export function lagosDateLabel(date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Lagos',
  }).format(date);
  return formatted.replace(',', '');
}

export function weekRangeLabel(weekStart: string, weekEnd: string): string {
  const start = isoNoon(weekStart);
  const end = isoNoon(weekEnd);
  const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'Africa/Lagos' });
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Africa/Lagos' });
  if (month.format(start) === month.format(end)) {
    return `Mon ${day.format(start)} to Sun ${day.format(end)} ${month.format(end)}`;
  }
  return `Mon ${day.format(start)} ${month.format(start)} to Sun ${day.format(end)} ${month.format(end)}`;
}

function isoNoon(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12));
}

export function ageLabel(iso: string, now = new Date()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const days = Math.floor((now.getTime() - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

const PILL_ORDER: AttentionReason[] = [
  'open_dispute',
  'approval_overdue',
  'flagged_photo',
  'no_update',
  'high_risk',
  'extra_monitoring',
];

export function attentionPill(job: LiveJob, now = new Date()): { text: string; tone: 'red' | 'amber' | 'gray' } {
  const reason = PILL_ORDER.find((item) => job.attention.includes(item));
  if (reason === 'open_dispute') return { text: 'Dispute open', tone: 'red' };
  if (reason === 'approval_overdue') return { text: 'Needs homeowner approval', tone: 'amber' };
  if (reason === 'flagged_photo') return { text: 'Photo check', tone: 'amber' };
  if (reason === 'no_update') {
    const days = Math.max(1, Math.floor((now.getTime() - new Date(job.lastActivityAt).getTime()) / (24 * 60 * 60 * 1000)));
    return { text: `No update in ${days} days`, tone: 'amber' };
  }
  if (reason === 'high_risk') return { text: 'High risk', tone: 'red' };
  if (reason === 'extra_monitoring') return { text: 'Extra monitoring', tone: 'amber' };
  return { text: stageStatusLabel(job.stageStatus), tone: 'gray' };
}

function stageStatusLabel(status: string | null): string {
  if (status === 'in_progress') return 'In progress';
  if (status === 'pending_homeowner_approval') return 'Needs homeowner approval';
  if (status === 'not_started') return 'Not started';
  if (status === 'completed') return 'Completed';
  if (status === 'blocked') return 'Blocked';
  if (!status) return 'In progress';
  return status.replace(/_/g, ' ');
}

export function photoNote(photos: LiveJob['photos']): string {
  const total = photos.onSite + photos.fromGallery + photos.notChecked;
  if (photos.reused > 0) return photos.reused === 1 ? '1 photo reused' : `${photos.reused} photos reused`;
  if (total === 0) return '';
  if (photos.onSite === total) return total === 1 ? '1 photo, on site' : `${total} photos, all on site`;
  if (photos.fromGallery === total) return total === 1 ? '1 photo from gallery' : `${total} photos from gallery`;
  if (photos.notChecked === total) return total === 1 ? '1 photo not checked' : `${total} photos not checked`;
  const parts: string[] = [];
  if (photos.onSite) parts.push(`${photos.onSite} on site`);
  if (photos.fromGallery) parts.push(`${photos.fromGallery} from gallery`);
  if (photos.notChecked) parts.push(`${photos.notChecked} not checked`);
  return `${total} photos, ${parts.join(', ')}`;
}

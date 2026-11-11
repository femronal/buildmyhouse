import { BadRequestException } from '@nestjs/common';

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type LagosWeek = { start: Date; end: Date; weekStartIso: string };

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function weekFromLagosMonday(year: number, monthIndex: number, day: number): LagosWeek {
  const mondayUtc = Date.UTC(year, monthIndex, day);
  const start = new Date(mondayUtc - LAGOS_OFFSET_MS);
  const end = new Date(start.getTime() + WEEK_MS - 1);
  const monday = new Date(mondayUtc);
  const weekStartIso = `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
  return { start, end, weekStartIso };
}

export function lagosWeekContaining(date: Date): LagosWeek {
  const shifted = new Date(date.getTime() + LAGOS_OFFSET_MS);
  const weekday = shifted.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysFromMonday));
  return weekFromLagosMonday(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
}

export function previousLagosWeek(date: Date): LagosWeek {
  const current = lagosWeekContaining(date);
  return lagosWeekContaining(new Date(current.start.getTime() - 1));
}

export function lagosWeekFromIso(iso: string): LagosWeek {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new BadRequestException('Pick a Monday.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new BadRequestException('Pick a Monday.');
  }
  if (utc.getUTCDay() !== 1) throw new BadRequestException('Pick a Monday.');
  return weekFromLagosMonday(year, month - 1, day);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function lagosDateLabel(date: Date): string {
  const shifted = new Date(date.getTime() + LAGOS_OFFSET_MS);
  return `${shifted.getUTCDate()} ${MONTHS[shifted.getUTCMonth()]} ${shifted.getUTCFullYear()}`;
}

export function lagosShortLabel(iso: string, withYear = false): string {
  const [year, month, day] = iso.split('-').map(Number);
  const text = `${day} ${MONTHS[(month || 1) - 1]}`;
  return withYear ? `${text} ${year}` : text;
}

export function addIsoDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

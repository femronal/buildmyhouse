import { BadRequestException } from '@nestjs/common';
import { lagosWeekContaining, lagosWeekFromIso, previousLagosWeek } from './lagos-week';

describe('lagos week', () => {
  it('lagos week starts Monday 00:00 Lagos which is Sunday 23:00 UTC', () => {
    const week = lagosWeekContaining(new Date('2026-11-08T23:00:00.000Z'));
    expect(week.start.toISOString()).toBe('2026-11-08T23:00:00.000Z');
    expect(week.end.toISOString()).toBe('2026-11-15T22:59:59.999Z');
    expect(week.weekStartIso).toBe('2026-11-09');

    const tuesday = lagosWeekContaining(new Date('2026-11-10T09:00:00.000Z'));
    expect(tuesday.start.toISOString()).toBe('2026-11-08T23:00:00.000Z');
    expect(tuesday.weekStartIso).toBe('2026-11-09');
  });

  it('a Sunday 23:30 Lagos time belongs to the week that started six days earlier', () => {
    const week = lagosWeekContaining(new Date('2026-11-15T22:30:00.000Z'));
    expect(week.weekStartIso).toBe('2026-11-09');
    expect(week.start.toISOString()).toBe('2026-11-08T23:00:00.000Z');
  });

  it('previous week of a Monday 08:00 Lagos is the Monday to Sunday before it', () => {
    const week = previousLagosWeek(new Date('2026-11-09T07:00:00.000Z'));
    expect(week.weekStartIso).toBe('2026-11-02');
    expect(week.start.toISOString()).toBe('2026-11-01T23:00:00.000Z');
    expect(week.end.toISOString()).toBe('2026-11-08T22:59:59.999Z');
  });

  it('lagosWeekFromIso rejects a date that is not a Monday', () => {
    expect(() => lagosWeekFromIso('2026-11-10')).toThrow(BadRequestException);
    expect(() => lagosWeekFromIso('2026-11-10')).toThrow('Pick a Monday.');
    expect(() => lagosWeekFromIso('2026-02-31')).toThrow('Pick a Monday.');
    expect(lagosWeekFromIso('2026-11-09').weekStartIso).toBe('2026-11-09');
  });
});

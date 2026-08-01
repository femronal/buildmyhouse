import { computeDueAt, hoursForPriority, parseSlaConfig, DEFAULT_SLA_HOURS } from './sla';

describe('sla', () => {
  it('uses default hours by priority', () => {
    expect(hoursForPriority('critical')).toBe(4);
    expect(hoursForPriority('high')).toBe(24);
    expect(hoursForPriority('medium')).toBe(72);
    expect(hoursForPriority('low')).toBe(168);
  });

  it('computeDueAt adds hours from openedAt', () => {
    const opened = new Date('2026-07-31T12:00:00.000Z');
    const due = computeDueAt('critical', opened);
    expect(due.toISOString()).toBe('2026-07-31T16:00:00.000Z');
    const dueHigh = computeDueAt('high', opened);
    expect(dueHigh.toISOString()).toBe('2026-08-01T12:00:00.000Z');
  });

  it('parseSlaConfig falls back to defaults', () => {
    expect(parseSlaConfig(null)).toEqual(DEFAULT_SLA_HOURS);
    expect(parseSlaConfig({ criticalHours: 2 }).criticalHours).toBe(2);
    expect(parseSlaConfig({ criticalHours: -1 }).criticalHours).toBe(4);
  });
});

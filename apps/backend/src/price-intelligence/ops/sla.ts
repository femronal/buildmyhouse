/**
 * Stage 8 — SLA due dates by priority.
 * Defaults: critical 4h, high 24h, medium 72h, low 168h.
 */

import { PriorityLabel } from './priority';

export interface SlaHoursConfig {
  criticalHours: number;
  highHours: number;
  mediumHours: number;
  lowHours: number;
}

export const DEFAULT_SLA_HOURS: Readonly<SlaHoursConfig> = {
  criticalHours: 4,
  highHours: 24,
  mediumHours: 72,
  lowHours: 168,
};

export function hoursForPriority(priority: PriorityLabel, config: SlaHoursConfig = DEFAULT_SLA_HOURS): number {
  switch (priority) {
    case 'critical':
      return config.criticalHours;
    case 'high':
      return config.highHours;
    case 'medium':
      return config.mediumHours;
    case 'low':
      return config.lowHours;
    default:
      return config.mediumHours;
  }
}

export function computeDueAt(
  priority: PriorityLabel,
  openedAt: Date,
  config: SlaHoursConfig = DEFAULT_SLA_HOURS,
): Date {
  const hours = hoursForPriority(priority, config);
  return new Date(openedAt.getTime() + hours * 60 * 60 * 1000);
}

export function parseSlaConfig(raw: unknown): SlaHoursConfig {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback;
  return {
    criticalHours: num(obj.criticalHours, DEFAULT_SLA_HOURS.criticalHours),
    highHours: num(obj.highHours, DEFAULT_SLA_HOURS.highHours),
    mediumHours: num(obj.mediumHours, DEFAULT_SLA_HOURS.mediumHours),
    lowHours: num(obj.lowHours, DEFAULT_SLA_HOURS.lowHours),
  };
}

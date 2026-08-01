import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_SLA_HOURS, parseSlaConfig, SlaHoursConfig } from './sla';
import { PriceIntelligenceAuditService } from './audit.service';

export const SETTING_KEYS = {
  SLA_HOURS: 'sla_hours',
  LOW_CONFIDENCE_SCORE_THRESHOLD: 'low_confidence_score_threshold',
  MATERIAL_PRICE_CHANGE_PCT: 'material_price_change_pct',
} as const;

@Injectable()
export class PriceIntelligenceSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  async getAll(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.priceIntelligenceSetting.findMany();
    const out: Record<string, unknown> = {
      [SETTING_KEYS.SLA_HOURS]: DEFAULT_SLA_HOURS,
      [SETTING_KEYS.LOW_CONFIDENCE_SCORE_THRESHOLD]: 0.5,
      [SETTING_KEYS.MATERIAL_PRICE_CHANGE_PCT]: 10,
    };
    for (const row of rows) {
      out[row.key] = row.valueJson;
    }
    return out;
  }

  async getSlaHours(): Promise<SlaHoursConfig> {
    const row = await this.prisma.priceIntelligenceSetting.findUnique({
      where: { key: SETTING_KEYS.SLA_HOURS },
    });
    return parseSlaConfig(row?.valueJson ?? null);
  }

  async getLowConfidenceScoreThreshold(): Promise<number> {
    const row = await this.prisma.priceIntelligenceSetting.findUnique({
      where: { key: SETTING_KEYS.LOW_CONFIDENCE_SCORE_THRESHOLD },
    });
    const v = row?.valueJson;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v && typeof v === 'object' && 'value' in (v as object)) {
      const n = Number((v as { value: unknown }).value);
      if (Number.isFinite(n)) return n;
    }
    return 0.5;
  }

  async upsert(key: string, valueJson: unknown, actorAdminId: string) {
    const before = await this.prisma.priceIntelligenceSetting.findUnique({ where: { key } });
    const row = await this.prisma.priceIntelligenceSetting.upsert({
      where: { key },
      create: {
        key,
        valueJson: valueJson as Prisma.InputJsonValue,
        updatedByAdminId: actorAdminId,
      },
      update: {
        valueJson: valueJson as Prisma.InputJsonValue,
        updatedByAdminId: actorAdminId,
      },
    });
    await this.audit.write({
      action: 'settings.upsert',
      entityType: 'PriceIntelligenceSetting',
      entityId: row.id,
      actorAdminId,
      beforeJson: before?.valueJson ?? null,
      afterJson: row.valueJson,
    });
    return row;
  }
}

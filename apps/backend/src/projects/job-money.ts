import { BadRequestException } from '@nestjs/common';

export const PAYEE_KINDS = ['artisan', 'shop', 'other'] as const;
export const LINE_STATUSES = ['planned', 'invoiced', 'paid', 'rejected'] as const;
export const PAID_BY = ['bmh', 'gc'] as const;

export type PayeeKind = (typeof PAYEE_KINDS)[number];
export type LineStatus = (typeof LINE_STATUSES)[number];
export type PaidBy = (typeof PAID_BY)[number];

type MaterialLine = {
  payeeKind?: string | null;
  status?: string | null;
  totalPrice?: number | null;
  quantity?: number | null;
  unitPrice?: number | null;
};

type TeamLine = {
  payStatus?: string | null;
  paidBy?: string | null;
  paidAmount?: number | null;
  dailyRate?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

type PaymentLine = {
  id?: string | null;
  amount?: number | null;
  status?: string | null;
  method?: string | null;
  createdAt?: Date | string | null;
};

export type JobMoneyStage = {
  estimatedCost?: number | null;
  materials?: MaterialLine[] | null;
  teamMembers?: TeamLine[] | null;
};

export type JobMoneySummary = {
  fullJobPrice: number;
  paidToYou: number;
  paidToShops: number;
  otherPaid: number;
  moneyMoved: number;
  leftOnThisJob: number;
  youSentIn: number;
  sentToContractor: number;
  paidToShopsForMaterials: number;
  stillWithBuildMyHouse: number;
  hasHomeownerReceipts: boolean;
  receipts: Array<{ id: string; amount: number; method: string | null; createdAt: Date | string | null }>;
  earned: number;
  pending: number;
  budget: number;
};

export function teamDayCount(startDate?: Date | string | null, endDate?: Date | string | null): number {
  if (startDate && endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (Number.isFinite(start) && Number.isFinite(end)) {
      return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    }
  }
  return 1;
}

export function teamLineAmount(member: TeamLine): number {
  if (member.paidAmount != null && Number.isFinite(Number(member.paidAmount))) {
    return Number(member.paidAmount);
  }
  return (Number(member.dailyRate) || 0) * teamDayCount(member.startDate, member.endDate);
}

function cleanToken(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

export function materialLineAmount(line: MaterialLine): number {
  const total = Number(line.totalPrice);
  if (Number.isFinite(total) && total > 0) return total;
  const quantity = Number(line.quantity);
  const unitPrice = Number(line.unitPrice);
  if (Number.isFinite(quantity) && Number.isFinite(unitPrice) && quantity * unitPrice > 0) {
    return quantity * unitPrice;
  }
  return Number.isFinite(total) ? total : 0;
}

export function stageBmhPaidAmount(stage: JobMoneyStage): number {
  const materials = (stage.materials || []).reduce((sum, line) => {
    if (cleanToken(line.status) !== 'paid') return sum;
    return sum + materialLineAmount(line);
  }, 0);
  const team = (stage.teamMembers || []).reduce((sum, line) => {
    if (cleanToken(line.payStatus) !== 'paid' || cleanToken(line.paidBy) !== 'bmh') return sum;
    return sum + teamLineAmount(line);
  }, 0);
  return materials + team;
}

export function summarizeJobMoney(input: {
  budget?: number | null;
  stages?: JobMoneyStage[] | null;
  payments?: PaymentLine[] | null;
}): JobMoneySummary {
  let artisanPaid = 0;
  let shopPaid = 0;
  let otherPaid = 0;

  for (const stage of input.stages || []) {
    for (const line of stage.materials || []) {
      if (cleanToken(line.status) !== 'paid') continue;
      const amount = materialLineAmount(line);
      const kind = cleanToken(line.payeeKind);
      if (kind === 'artisan') artisanPaid += amount;
      else if (kind === 'shop') shopPaid += amount;
      else if (kind === 'other') otherPaid += amount;
    }
    for (const line of stage.teamMembers || []) {
      if (cleanToken(line.payStatus) !== 'paid' || cleanToken(line.paidBy) !== 'bmh') continue;
      artisanPaid += teamLineAmount(line);
    }
  }

  const fullJobPrice = Number(input.budget) || 0;
  const moneyMoved = artisanPaid + shopPaid + otherPaid;
  const completed = (input.payments || []).filter((payment) => payment.status === 'completed');
  const youSentIn = completed.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

  return {
    fullJobPrice,
    paidToYou: artisanPaid,
    paidToShops: shopPaid,
    otherPaid,
    moneyMoved,
    leftOnThisJob: Math.max(0, fullJobPrice - moneyMoved),
    youSentIn,
    sentToContractor: artisanPaid,
    paidToShopsForMaterials: shopPaid,
    stillWithBuildMyHouse: Math.max(0, youSentIn - artisanPaid - shopPaid - otherPaid),
    hasHomeownerReceipts: completed.length > 0,
    receipts: completed.map((payment) => ({
      id: String(payment.id || ''),
      amount: Number(payment.amount) || 0,
      method: payment.method ? String(payment.method) : null,
      createdAt: payment.createdAt || null,
    })),
    earned: artisanPaid,
    pending: Math.max(0, fullJobPrice - moneyMoved),
    budget: fullJobPrice,
  };
}

function assertStatus(status: string) {
  if (!LINE_STATUSES.includes(status as LineStatus)) {
    throw new BadRequestException('Status must be planned, invoiced, paid, or rejected.');
  }
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Paid date is not a real date.');
  }
  return date;
}

function cleanRef(value: string | null | undefined): string | null {
  const text = String(value || '').trim();
  return text || null;
}

export function materialPayWrite(
  dto: {
    payeeKind?: string | null;
    status?: string | null;
    paidAt?: string | Date | null;
    hoPaymentRef?: string | null;
  },
  existing: { status?: string | null; paidAt?: Date | string | null } | undefined,
  mode: 'create' | 'update',
) {
  const data: {
    payeeKind?: string;
    status?: string;
    paidAt?: Date | null;
    hoPaymentRef?: string | null;
  } = {};

  if (mode === 'create') {
    const kind = String(dto.payeeKind || '').trim();
    if (!PAYEE_KINDS.includes(kind as PayeeKind)) {
      throw new BadRequestException('Choose artisan, shop, or other for this line.');
    }
    const status = dto.status ? String(dto.status).trim() : 'planned';
    assertStatus(status);
    data.payeeKind = kind;
    data.status = status;
    data.paidAt = status === 'paid' ? parseDate(dto.paidAt) || new Date() : null;
    if (dto.hoPaymentRef !== undefined) data.hoPaymentRef = cleanRef(dto.hoPaymentRef);
    return data;
  }

  if (dto.payeeKind !== undefined) {
    const kind = String(dto.payeeKind || '').trim();
    if (!PAYEE_KINDS.includes(kind as PayeeKind)) {
      throw new BadRequestException('Choose artisan, shop, or other for this line.');
    }
    data.payeeKind = kind;
  }

  if (dto.status !== undefined) {
    const status = String(dto.status || '').trim();
    assertStatus(status);
    data.status = status;
    data.paidAt = status === 'paid' ? parseDate(dto.paidAt) || (existing?.paidAt ? new Date(existing.paidAt) : new Date()) : null;
  } else if (dto.paidAt !== undefined && existing?.status === 'paid') {
    data.paidAt = parseDate(dto.paidAt) || new Date();
  }

  if (dto.hoPaymentRef !== undefined) data.hoPaymentRef = cleanRef(dto.hoPaymentRef);
  return data;
}

export function teamPayWrite(
  dto: {
    payStatus?: string | null;
    paidAmount?: number | null;
    paidAt?: string | Date | null;
    paidBy?: string | null;
    hoPaymentRef?: string | null;
  },
  existing: { payStatus?: string | null; paidAt?: Date | string | null; paidBy?: string | null } | undefined,
  mode: 'create' | 'update',
) {
  const data: {
    payStatus?: string;
    paidAmount?: number | null;
    paidAt?: Date | null;
    paidBy?: string | null;
    hoPaymentRef?: string | null;
  } = {};

  const nextStatus = dto.payStatus !== undefined
    ? String(dto.payStatus || '').trim()
    : mode === 'create'
      ? 'planned'
      : String(existing?.payStatus || 'planned');

  if (dto.payStatus !== undefined || mode === 'create') {
    assertStatus(nextStatus);
    data.payStatus = nextStatus;
  }

  const paidByInput = dto.paidBy !== undefined ? String(dto.paidBy || '').trim() : undefined;
  const nextPaidBy = paidByInput !== undefined ? paidByInput : existing?.paidBy || '';

  if (nextStatus === 'paid' && nextPaidBy !== 'bmh' && nextPaidBy !== 'gc') {
    throw new BadRequestException('When this team line is paid, say who paid: bmh or gc.');
  }
  if (paidByInput !== undefined && paidByInput !== '' && paidByInput !== 'bmh' && paidByInput !== 'gc') {
    throw new BadRequestException('Who paid must be bmh or gc.');
  }
  if (dto.paidBy !== undefined || (nextStatus === 'paid' && (dto.payStatus !== undefined || mode === 'create'))) {
    data.paidBy = nextPaidBy === 'bmh' || nextPaidBy === 'gc' ? nextPaidBy : null;
  }

  if (dto.paidAmount !== undefined) {
    if (dto.paidAmount == null || (dto.paidAmount as unknown) === '') {
      data.paidAmount = null;
    } else {
      const amount = Number(dto.paidAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new BadRequestException('Paid amount must be a number.');
      }
      data.paidAmount = amount;
    }
  }

  if (dto.payStatus !== undefined || mode === 'create') {
    data.paidAt = nextStatus === 'paid'
      ? parseDate(dto.paidAt) || (existing?.paidAt ? new Date(existing.paidAt) : new Date())
      : null;
  } else if (dto.paidAt !== undefined && nextStatus === 'paid') {
    data.paidAt = parseDate(dto.paidAt) || new Date();
  }

  if (dto.hoPaymentRef !== undefined) data.hoPaymentRef = cleanRef(dto.hoPaymentRef);
  return data;
}

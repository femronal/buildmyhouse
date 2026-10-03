import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { buildJoinChecklist } from './join-checklist';
import { formatJoinReference, randomJoinSerial } from './join-request-reference';

const PROOF_KEYS = ['cac', 'council', 'id', 'reference', 'address', 'shopPhoto'] as const;
const PROOF_VALUES = new Set(['added', 'not_have', 'not_applicable']);

@Injectable()
export class JoinRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateJoinRequestDto) {
    if (dto.companyFax && dto.companyFax.trim()) {
      return { received: true };
    }
    if (dto.termsAcknowledged !== true) {
      throw new BadRequestException('Terms must be acknowledged');
    }
    const answers = parseObject(dto.answersJson, 'answersJson');
    const proofs = readProofs(answers);
    const utm = dto.utmJson ? parseObject(dto.utmJson, 'utmJson') : undefined;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await this.prisma.joinRequest.findFirst({
      where: { whatsapp: dto.whatsapp, path: dto.path, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
    const data = {
      path: dto.path,
      answers: answers as Prisma.InputJsonValue,
      proofs: proofs as Prisma.InputJsonValue,
      photos: typeof answers.photos === 'string' ? answers.photos : null,
      tradeKeys: stringList(answers.tradeKeys),
      serviceLabels: stringList(answers.serviceLabels),
      state: typeof answers.state === 'string' ? answers.state : null,
      areas: stringList(answers.areas),
      name: dto.name.trim(),
      whatsapp: dto.whatsapp,
      termsAcknowledgedAt: new Date(),
      termsVersion: dto.termsVersion || null,
      source: dto.source?.trim() || 'join',
      referrer: dto.referrer?.trim() || null,
      utm: utm ? (utm as Prisma.InputJsonValue) : undefined,
    };
    if (existing) {
      const row = await this.prisma.joinRequest.update({ where: { id: existing.id }, data });
      return {
        id: row.id,
        reference: row.reference,
        checklist: buildJoinChecklist(dto.path, answers),
      };
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reference = formatJoinReference(dto.path, randomJoinSerial());
      try {
        const row = await this.prisma.joinRequest.create({ data: { ...data, reference } });
        return {
          id: row.id,
          reference: row.reference,
          checklist: buildJoinChecklist(dto.path, answers),
        };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
        throw error;
      }
    }
    throw new BadRequestException('Could not save this request. You can still send it on WhatsApp.');
  }

  async list(query: { path?: string; status?: string; page?: string }) {
    const page = Math.max(1, Number(query.page || 1));
    const where: Prisma.JoinRequestWhereInput = {};
    if (query.path) where.path = query.path;
    if (query.status) where.status = query.status as any;
    const [items, total] = await Promise.all([
      this.prisma.joinRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 30,
        take: 30,
      }),
      this.prisma.joinRequest.count({ where }),
    ]);
    return { items, total, page };
  }

  async get(id: string) {
    const row = await this.prisma.joinRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Join request not found');
    return row;
  }

  async update(id: string, body: { status?: string; adminNotes?: string }, adminId: string) {
    await this.get(id);
    return this.prisma.joinRequest.update({
      where: { id },
      data: {
        status: body.status as any,
        adminNotes: body.adminNotes,
        handledByAdminId: adminId,
        handledAt: new Date(),
      },
    });
  }
}

function readProofs(answers: Record<string, unknown>) {
  const raw = answers.proofs;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const proofs: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!PROOF_KEYS.includes(key as (typeof PROOF_KEYS)[number])) {
      throw new BadRequestException(`Unknown proof key: ${key}`);
    }
    if (typeof value !== 'string' || !PROOF_VALUES.has(value)) {
      throw new BadRequestException(`Invalid proof value for ${key}`);
    }
    proofs[key] = value;
  }
  return proofs;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function parseObject(raw: string, field: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not-object');
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(`${field} must be a JSON object`);
  }
}

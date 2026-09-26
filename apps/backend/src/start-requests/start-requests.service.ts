import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStartRequestDto } from './dto/create-start-request.dto';
import { formatStartReference, randomStartSerial } from './start-request-reference';

@Injectable()
export class StartRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStartRequestDto) {
    const answers = parseObject(dto.answersJson, 'answersJson');
    const utm = dto.utmJson ? parseObject(dto.utmJson, 'utmJson') : undefined;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reference = formatStartReference(dto.path, randomStartSerial());
      try {
        const row = await this.prisma.startRequest.create({
          data: {
            reference,
            path: dto.path,
            answers: answers as Prisma.InputJsonValue,
            name: dto.name.trim(),
            whatsapp: dto.whatsapp.trim(),
            source: dto.source?.trim() || null,
            referrer: dto.referrer?.trim() || null,
            utm: utm ? (utm as Prisma.InputJsonValue) : undefined,
          },
        });
        return { id: row.id, reference: row.reference };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException('Could not save this request. You can still send it on WhatsApp.');
  }
}

function parseObject(raw: string, field: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not-object');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new BadRequestException(`${field} must be a JSON object`);
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpsertResourceSectionDto } from './dto/upsert-resource-section.dto';

@Injectable()
export class ResourceSectionsService {
  private prisma = new PrismaClient() as any;

  private normalizeKey(raw: string) {
    return String(raw || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private normalizePayload(dto: UpsertResourceSectionDto) {
    const key = this.normalizeKey(dto.key);
    if (!key) {
      throw new BadRequestException('Section key is required');
    }
    if (key === 'all') {
      throw new BadRequestException('The key "all" is reserved');
    }

    return {
      key,
      label: String(dto.label || '').trim(),
      hint: String(dto.hint || '').trim(),
      sortOrder: Number.isFinite(Number(dto.sortOrder)) ? Number(dto.sortOrder) : 0,
      isActive: dto.isActive !== false,
    };
  }

  async listPublic() {
    return this.prisma.cmsResourceSection.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      select: {
        id: true,
        key: true,
        label: true,
        hint: true,
        sortOrder: true,
      },
    });
  }

  async listAdmin() {
    return this.prisma.cmsResourceSection.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  async getActiveKeys(): Promise<Set<string>> {
    const rows = await this.prisma.cmsResourceSection.findMany({
      where: { isActive: true },
      select: { key: true },
    });
    return new Set(rows.map((row: { key: string }) => row.key));
  }

  async validateSectionKeys(keys: string[]) {
    const cleaned = keys.map((k) => this.normalizeKey(k)).filter(Boolean);
    if (cleaned.length === 0) return cleaned;

    const allowed = await this.getActiveKeys();
    const invalid = cleaned.filter((key) => !allowed.has(key));
    if (invalid.length > 0) {
      throw new BadRequestException(`Unknown or inactive resource section keys: ${invalid.join(', ')}`);
    }
    return cleaned;
  }

  async createAdmin(dto: UpsertResourceSectionDto) {
    const payload = this.normalizePayload(dto);
    if (!payload.label) {
      throw new BadRequestException('Section label is required');
    }

    return this.prisma.cmsResourceSection.create({
      data: {
        ...payload,
        isSystem: false,
      },
    });
  }

  async updateAdmin(id: string, dto: UpsertResourceSectionDto) {
    const existing = await this.prisma.cmsResourceSection.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Resource section not found');
    }

    const payload = this.normalizePayload(dto);
    if (!payload.label) {
      throw new BadRequestException('Section label is required');
    }

    if (existing.isSystem && payload.key !== existing.key) {
      throw new BadRequestException('System section keys cannot be changed');
    }

    return this.prisma.cmsResourceSection.update({
      where: { id },
      data: payload,
    });
  }

  async deleteAdmin(id: string) {
    const existing = await this.prisma.cmsResourceSection.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Resource section not found');
    }
    if (existing.isSystem) {
      throw new BadRequestException('System sections cannot be deleted. Deactivate instead.');
    }

    const articlesUsingKey = await this.prisma.cmsArticle.findFirst({
      where: { resourceSectionKeys: { has: existing.key } },
      select: { id: true },
    });
    if (articlesUsingKey) {
      throw new BadRequestException(
        'This section is assigned to one or more articles. Reassign those articles before deleting.',
      );
    }

    await this.prisma.cmsResourceSection.delete({ where: { id } });
    return { message: 'Resource section deleted successfully' };
  }
}

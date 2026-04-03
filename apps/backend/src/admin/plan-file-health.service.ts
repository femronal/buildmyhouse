import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { S3UploadService } from '../upload/s3-upload.service';

export type MissingPlanFileItem = {
  projectId: string;
  projectName: string;
  planPdfUrl: string;
  planFileName: string | null;
  status: string;
};

@Injectable()
export class PlanFileHealthService {
  private readonly logger = new Logger(PlanFileHealthService.name);
  private readonly bucket: string;
  private readonly region: string;
  private readonly s3Client: S3Client | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly s3UploadService: S3UploadService,
  ) {
    this.bucket = (this.configService.get<string>('AWS_S3_BUCKET') || '').trim();
    this.region = (this.configService.get<string>('AWS_REGION') || '').trim();
    this.s3Client =
      this.bucket && this.region
        ? new S3Client({
            region: this.region,
          })
        : null;
  }

  async scanMissingPlanFiles(limit = 120): Promise<MissingPlanFileItem[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        planPdfUrl: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        name: true,
        planPdfUrl: true,
        planFileName: true,
        status: true,
      },
    });

    const missing: MissingPlanFileItem[] = [];
    for (const project of projects) {
      const rawUrl = String(project.planPdfUrl || '').trim();
      if (!rawUrl) continue;

      const exists = await this.planFileExists(rawUrl);
      if (!exists) {
        missing.push({
          projectId: project.id,
          projectName: project.name,
          planPdfUrl: rawUrl,
          planFileName: project.planFileName || null,
          status: project.status,
        });
      }
    }

    return missing;
  }

  async repairMissingPlanFiles(limit = 200) {
    const projects = await this.prisma.project.findMany({
      where: {
        planPdfUrl: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        name: true,
        planPdfUrl: true,
        planFileName: true,
      },
    });

    let normalizedUrlFixes = 0;
    let repairedToS3 = 0;
    const unrecoverableProjectIds: string[] = [];

    for (const project of projects) {
      const raw = String(project.planPdfUrl || '').trim();
      if (!raw) continue;

      let planPdfUrl = raw;
      const normalized = this.normalizeUrl(raw);
      if (normalized !== raw) {
        await this.prisma.project.update({
          where: { id: project.id },
          data: { planPdfUrl: normalized },
        });
        planPdfUrl = normalized;
        normalizedUrlFixes += 1;
      }

      const exists = await this.planFileExists(planPdfUrl);
      if (exists) continue;

      if (planPdfUrl.startsWith('/uploads/')) {
        const localPath = join(process.cwd(), planPdfUrl.replace(/^\/+/, ''));
        if (existsSync(localPath)) {
          try {
            const buffer = readFileSync(localPath);
            const uploaded = await this.s3UploadService.uploadBuffer({
              buffer,
              folder: 'plans',
              contentType: 'application/pdf',
              originalName: project.planFileName || 'plan.pdf',
            });

            await this.prisma.project.update({
              where: { id: project.id },
              data: { planPdfUrl: uploaded.url },
            });
            repairedToS3 += 1;
            continue;
          } catch (error) {
            this.logger.warn(
              `Failed repairing plan file for project ${project.id}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }

      if (unrecoverableProjectIds.length < 100) {
        unrecoverableProjectIds.push(project.id);
      }
    }

    return {
      scanned: projects.length,
      normalizedUrlFixes,
      repairedToS3,
      unrecoverableCount: unrecoverableProjectIds.length,
      unrecoverableProjectIds,
    };
  }

  private async planFileExists(planPdfUrl: string): Promise<boolean> {
    // Legacy local/EFS path support
    if (planPdfUrl.startsWith('/uploads/')) {
      const localPath = join(process.cwd(), planPdfUrl.replace(/^\/+/, ''));
      if (existsSync(localPath)) {
        return true;
      }
    }

    const key = this.extractStorageKey(planPdfUrl);
    if (!this.s3Client || !this.bucket || !key) {
      return false;
    }

    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  private extractStorageKey(planPdfUrl: string) {
    const raw = String(planPdfUrl || '').trim();
    if (!raw) return '';

    if (raw.startsWith('/uploads/')) {
      return raw.replace(/^\/+/, '');
    }

    if (/^\/+https?:\/\//i.test(raw)) {
      const normalized = raw.replace(/^\/+/, '');
      try {
        const parsed = new URL(normalized);
        return parsed.pathname.replace(/^\/+/, '');
      } catch {
        return '';
      }
    }

    if (/^https?:\/\//i.test(raw)) {
      try {
        const parsed = new URL(raw);
        return parsed.pathname.replace(/^\/+/, '');
      } catch {
        return '';
      }
    }

    return raw.replace(/^\/+/, '');
  }

  private normalizeUrl(planPdfUrl: string) {
    const raw = String(planPdfUrl || '').trim();
    if (!raw) return '';
    if (/^\/+https?:\/\//i.test(raw)) {
      return raw.replace(/^\/+/, '');
    }
    return raw;
  }
}


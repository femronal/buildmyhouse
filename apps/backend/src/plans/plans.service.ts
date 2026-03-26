import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OpenAIService } from '../openai/openai.service';
import { UploadPlanDto } from './dto/upload-plan.dto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3UploadService } from '../upload/s3-upload.service';

@Injectable()
export class PlansService {
  private prisma = new PrismaClient();
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBaseUrl: string;
  private readonly s3Client: S3Client | null;

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly configService: ConfigService,
    private readonly s3UploadService: S3UploadService,
  ) {
    this.bucket = (this.configService.get<string>('AWS_S3_BUCKET') || '').trim();
    this.region = (this.configService.get<string>('AWS_REGION') || '').trim();
    this.publicBaseUrl = (this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL') || '').trim().replace(/\/+$/, '');
    this.s3Client =
      this.bucket && this.region
        ? new S3Client({
            region: this.region,
          })
        : null;
  }

  /**
   * Upload and process a plan PDF
   */
  async uploadAndProcessPlan(
    homeownerId: string,
    file: Express.Multer.File,
    uploadPlanDto: UploadPlanDto,
  ) {
    try {
      // 1. Save file metadata. Keep legacy local path fallback for existing flows.
      let planPdfUrl = `/uploads/plans/${file.filename}`;
      const planFileName = file.originalname;

      // 2. Read file from disk (diskStorage saves to disk, not buffer)
      const filePath = join(process.cwd(), 'uploads', 'plans', file.filename);
      let pdfBuffer: Buffer;
      
      if (file.buffer) {
        // If buffer exists (memoryStorage), use it
        pdfBuffer = file.buffer;
      } else {
        // If no buffer (diskStorage), read from disk
        if (!existsSync(filePath)) {
          throw new NotFoundException('Uploaded file could not be processed. Please try uploading again.');
        }
        pdfBuffer = readFileSync(filePath);
      }

      // 3. Upload to S3 when available so files remain durable across deployments.
      try {
        const uploaded = await this.s3UploadService.uploadBuffer({
          buffer: pdfBuffer,
          folder: 'plans',
          contentType: 'application/pdf',
          originalName: file.originalname,
        });
        if (uploaded?.url) {
          planPdfUrl = uploaded.url;
        }
      } catch {
        // Non-fatal: keep legacy local URL so existing environments still work.
      }

      // 4. Extract text from PDF
      const pdfText = await this.openaiService.extractTextFromPdf(pdfBuffer);

      // 5. Analyze with AI
      const aiAnalysis = await this.openaiService.analyzePlan(
        pdfText,
        uploadPlanDto.name,
        uploadPlanDto.budget,
      );

      // 6. Create project with analysis
      const project = await this.prisma.project.create({
        data: {
          name: uploadPlanDto.name,
          address: uploadPlanDto.address,
          street: uploadPlanDto.street,
          city: uploadPlanDto.city,
          state: uploadPlanDto.state,
          zipCode: uploadPlanDto.zipCode,
          country: uploadPlanDto.country,
          latitude: uploadPlanDto.latitude,
          longitude: uploadPlanDto.longitude,
          homeownerId,
          budget: aiAnalysis.estimatedBudget || uploadPlanDto.budget,
          projectType: uploadPlanDto.projectType,
          status: 'draft',
          progress: 0,
          spent: 0,
          planPdfUrl,
          planFileName,
          aiAnalysis: {
            ...(aiAnalysis as any),
            projectType: uploadPlanDto.projectType || (aiAnalysis as any)?.projectType || 'homebuilding',
            projectImageUrl: uploadPlanDto.planImageUrl,
          } as any, // JSON field
          aiProcessedAt: new Date(),
        },
        include: {
          homeowner: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });


      return {
        project,
        aiAnalysis,
      };
    } catch (error) {
      console.error('❌ Error uploading/processing plan:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        file: file?.filename,
        homeownerId,
      });
      // Re-throw NestJS HTTP exceptions as-is
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // Sanitize: never expose internal error details (paths, stack traces) to clients
      throw new BadRequestException(
        'Failed to process the uploaded plan. Please ensure the file is valid and try again.',
      );
    }
  }

  /**
   * Get project with AI analysis
   */
  async getProjectWithAnalysis(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        homeowner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        generalContractor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        projectRequests: {
          where: {
            status: 'accepted',
          },
          include: {
            contractor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                contractorProfile: {
                  select: {
                    id: true,
                    name: true,
                    specialty: true,
                    rating: true,
                    reviews: true,
                    projects: true,
                    verified: true,
                    location: true,
                  },
                },
              },
            },
          },
          take: 1, // Get the accepted request
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check authorization
    if (project.homeownerId !== userId && project.generalContractorId !== userId) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async getPlanDownloadUrl(projectId: string, userId: string, role?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        homeownerId: true,
        generalContractorId: true,
        planPdfUrl: true,
        planFileName: true,
        projectRequests: {
          where: {
            contractorId: userId,
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = role === 'admin';
    const isHomeowner = project.homeownerId === userId;
    const isAssignedGc = project.generalContractorId === userId;
    const isRequestedGc = (project.projectRequests || []).length > 0;

    if (!isAdmin && !isHomeowner && !isAssignedGc && !isRequestedGc) {
      throw new ForbiddenException('You are not authorized to access this plan');
    }

    if (!project.planPdfUrl) {
      throw new NotFoundException('Plan PDF is not available for this project');
    }

    const signedOrDirectUrl = await this.resolvePlanUrl(project.planPdfUrl, project.planFileName || 'plan.pdf');
    return {
      url: signedOrDirectUrl,
      fileName: project.planFileName || 'plan.pdf',
    };
  }

  private extractStorageKeyFromPlanUrl(planPdfUrl: string) {
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

  private sanitizeFilename(fileName: string) {
    return String(fileName || 'plan.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private async resolvePlanUrl(planPdfUrl: string, fileName: string) {
    // For legacy records saved as /uploads/*, prefer serving from backend local/EFS path
    // when present (avoids S3 NoSuchKey for historical objects not uploaded to S3).
    if (planPdfUrl.startsWith('/uploads/')) {
      const relPath = planPdfUrl.replace(/^\/+/, '');
      const localPath = join(process.cwd(), relPath);
      if (existsSync(localPath)) {
        return planPdfUrl;
      }
    }

    const key = this.extractStorageKeyFromPlanUrl(planPdfUrl);
    const safeFileName = this.sanitizeFilename(fileName);

    if (this.s3Client && this.bucket && key) {
      try {
        const signedUrl = await getSignedUrl(
          this.s3Client,
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ResponseContentType: 'application/pdf',
            ResponseContentDisposition: `attachment; filename=\"${safeFileName}\"`,
          }),
          { expiresIn: 60 * 15 },
        );
        return signedUrl;
      } catch {
        if (this.publicBaseUrl) {
          return `${this.publicBaseUrl}/${key}`;
        }
      }
    }

    return planPdfUrl;
  }
}




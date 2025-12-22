import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OpenAIService } from '../openai/openai.service';
import { UploadPlanDto } from './dto/upload-plan.dto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PlansService {
  private prisma = new PrismaClient();

  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * Upload and process a plan PDF
   */
  async uploadAndProcessPlan(
    homeownerId: string,
    file: Express.Multer.File,
    uploadPlanDto: UploadPlanDto,
  ) {
    try {
      // 1. Save file metadata (in production, upload to S3/Cloud Storage)
      const planPdfUrl = `/uploads/plans/${file.filename}`; // TODO: Replace with S3 URL
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
          throw new Error(`File not found at path: ${filePath}`);
        }
        pdfBuffer = readFileSync(filePath);
      }

      // 3. Extract text from PDF
      const pdfText = await this.openaiService.extractTextFromPdf(pdfBuffer);

      // 3. Analyze with AI
      const aiAnalysis = await this.openaiService.analyzePlan(
        pdfText,
        uploadPlanDto.name,
        uploadPlanDto.budget,
      );

      // 5. Create project with analysis
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
          status: 'draft',
          progress: 0,
          spent: 0,
          planPdfUrl,
          planFileName,
          aiAnalysis: aiAnalysis as any, // JSON field
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
      throw error;
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
}

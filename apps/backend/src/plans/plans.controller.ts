import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { PlansService } from './plans.service';
import { UploadPlanDto } from './dto/upload-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads', 'plans');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory:', uploadsDir);
    }
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'subcontractor', 'vendor', 'admin')
  @UseInterceptors(
    FileInterceptor('planPdf', {
      storage: diskStorage({
        destination: './uploads/plans',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `plan-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          return callback(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
    }),
  )
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra fields (like planPdf which Multer handles)
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  async uploadPlan(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadPlanDto: UploadPlanDto,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    const homeownerId = req.user.sub;

    return this.plansService.uploadAndProcessPlan(
      homeownerId,
      file,
      uploadPlanDto,
    );
  }

  @Get(':projectId/analysis')
  @UseGuards(JwtAuthGuard)
  async getProjectAnalysis(@Param('projectId') projectId: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.plansService.getProjectWithAnalysis(projectId, userId);
  }
}


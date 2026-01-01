import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';

@Controller('designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads', 'designs');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory:', uploadsDir);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra fields (like images which Multer handles)
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: './uploads/designs',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `design-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per image
      },
    }),
  )
  async createDesign(
    @Request() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    try {
      console.log('📥 [DesignsController] Received create design request');
      console.log('📥 [DesignsController] Files:', files?.length || 0);
      console.log('📥 [DesignsController] Body keys:', Object.keys(body));
      console.log('📥 [DesignsController] constructionPhases:', body.constructionPhases ? (typeof body.constructionPhases === 'string' ? body.constructionPhases.substring(0, 100) + '...' : body.constructionPhases) : 'not provided');

      if (!files || files.length === 0) {
        throw new BadRequestException('At least one image is required');
      }

      const userId = req.user?.sub;
      console.log('👤 [DesignsController] User ID:', userId);
      console.log('👤 [DesignsController] User object:', req.user);

      if (!userId) {
        console.error('❌ [DesignsController] No user ID found in request');
        throw new BadRequestException('User ID not found in token');
      }

      // Extract design data from body (FormData fields come as strings)
      const createDesignDto: CreateDesignDto = {
        name: body.name,
        description: body.description || undefined,
        bedrooms: parseInt(body.bedrooms),
        bathrooms: parseInt(body.bathrooms),
        squareFootage: parseFloat(body.squareFootage),
        estimatedCost: parseFloat(body.estimatedCost),
        floors: body.floors ? parseInt(body.floors) : undefined,
        estimatedDuration: body.estimatedDuration || undefined,
        rooms: body.rooms || undefined,
        materials: body.materials || undefined,
        features: body.features || undefined,
        constructionPhases: body.constructionPhases || undefined,
        images: [], // Will be populated below
      };

      console.log('📋 [DesignsController] Parsed DTO:', createDesignDto);

      // Parse image labels if sent as array or individual fields
      const imageLabels: string[] = [];
      if (Array.isArray(body.imageLabels)) {
        imageLabels.push(...body.imageLabels);
      } else if (body.imageLabels) {
        imageLabels.push(body.imageLabels);
      }

      console.log('🏷️ [DesignsController] Image labels:', imageLabels);

      // Map uploaded files to image DTOs
      const images = files.map((file, index) => ({
        url: `/uploads/designs/${file.filename}`, // In production, upload to S3
        label: imageLabels[index] || `Image ${index + 1}`,
        order: index,
      }));

      console.log('🖼️ [DesignsController] Mapped images:', images);

      const result = await this.designsService.createDesign(userId, {
        ...createDesignDto,
        images,
      });

      console.log('✅ [DesignsController] Design created successfully:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ [DesignsController] Error creating design:', error);
      console.error('❌ [DesignsController] Error stack:', error.stack);
      console.error('❌ [DesignsController] Error message:', error.message);
      throw error;
    }
  }

  @Get()
  // Public endpoint - no auth required for browsing designs
  async getAllDesigns() {
    return this.designsService.getAllDesigns();
  }

  @Get('my-designs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async getMyDesigns(@Request() req: any) {
    const userId = req.user.sub;
    return this.designsService.getDesignsByUser(userId);
  }

  @Get(':id')
  // Public endpoint - no auth required for viewing a single design
  async getDesignById(@Param('id') id: string) {
    return this.designsService.getDesignById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async deleteDesign(@Param('id') id: string, @Request() req: any) {
    try {
      console.log('🗑️ [DesignsController] Delete request for design:', id);
      const userId = req.user?.sub;
      console.log('👤 [DesignsController] User ID:', userId);
      
      if (!userId) {
        throw new BadRequestException('User ID not found in token');
      }

      const result = await this.designsService.deleteDesign(id, userId);
      console.log('✅ [DesignsController] Design deleted successfully:', id);
      return result;
    } catch (error: any) {
      console.error('❌ [DesignsController] Error deleting design:', error);
      console.error('❌ [DesignsController] Error stack:', error.stack);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async updateDesign(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    const userId = req.user.sub;
    return this.designsService.updateDesign(id, userId, body);
  }
}


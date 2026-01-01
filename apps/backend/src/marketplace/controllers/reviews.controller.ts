import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/rbac.guard';

@Controller('marketplace/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'subcontractor', 'admin')
  create(@Request() req: any, @Body() createReviewDto: CreateReviewDto) {
    const userId = req.user?.sub;
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get('material/:materialId')
  getMaterialReviews(
    @Param('materialId') materialId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.reviewsService.getMaterialReviews(materialId, page, limit);
  }

  @Get('contractor/:contractorId')
  getContractorReviews(
    @Param('contractorId') contractorId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.reviewsService.getContractorReviews(contractorId, page, limit);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'subcontractor', 'admin')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { rating?: number; comment?: string },
  ) {
    const userId = req.user?.sub;
    return this.reviewsService.update(id, userId, data.rating, data.comment);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'subcontractor', 'admin')
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.reviewsService.remove(id, userId);
  }
}




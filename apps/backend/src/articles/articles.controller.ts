import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { UpsertArticleDto } from './dto/upsert-article.dto';
import { UpdateArticleStatusDto } from './dto/update-article-status.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  listPublished(@Query('audience') audience?: string) {
    return this.articlesService.listPublished(audience);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin(@Query('audience') audience?: string) {
    return this.articlesService.listAdmin(audience);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminById(@Param('id') id: string) {
    return this.articlesService.getAdminById(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createAdmin(@Body() dto: UpsertArticleDto) {
    return this.articlesService.createAdmin(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateAdmin(@Param('id') id: string, @Body() dto: UpsertArticleDto) {
    return this.articlesService.updateAdmin(id, dto);
  }

  @Patch('admin/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updatePublishStatus(@Param('id') id: string, @Body() dto: UpdateArticleStatusDto) {
    return this.articlesService.updatePublishStatus(id, dto.isPublished);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteAdmin(@Param('id') id: string) {
    return this.articlesService.deleteAdmin(id);
  }

  @Get(':slug')
  getPublishedBySlug(@Param('slug') slug: string, @Query('audience') audience?: string) {
    return this.articlesService.getPublishedBySlug(slug, audience);
  }
}

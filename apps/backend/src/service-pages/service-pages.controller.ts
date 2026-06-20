import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ServicePagesService } from './service-pages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { UpsertServicePageDto } from './dto/upsert-service-page.dto';
import { UpdateServicePageStatusDto } from './dto/update-service-page-status.dto';

@Controller('service-pages')
export class ServicePagesController {
  constructor(private readonly servicePagesService: ServicePagesService) {}

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin(@Query('region') region?: string) {
    return this.servicePagesService.listAdmin(region);
  }

  @Get('admin/template/:templateKind')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getTemplate(
    @Param('templateKind') templateKind: string,
    @Query('region') region?: string,
    @Query('slug') slug?: string,
  ) {
    return this.servicePagesService.getTemplate(templateKind, region, slug);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminById(@Param('id') id: string) {
    return this.servicePagesService.getAdminById(id);
  }

  @Post('admin/from-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createFromTemplate(
    @Body()
    body: {
      slug: string;
      region: 'lagos' | 'nigeria';
      templateKind: string;
      metaTitle?: string;
      summary?: string;
    },
  ) {
    return this.servicePagesService.createFromTemplate(body);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createAdmin(@Body() dto: UpsertServicePageDto) {
    return this.servicePagesService.createAdmin(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateAdmin(@Param('id') id: string, @Body() dto: UpsertServicePageDto) {
    return this.servicePagesService.updateAdmin(id, dto);
  }

  @Patch('admin/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updatePublishStatus(@Param('id') id: string, @Body() dto: UpdateServicePageStatusDto) {
    return this.servicePagesService.updatePublishStatus(id, dto.isPublished);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteAdmin(@Param('id') id: string) {
    return this.servicePagesService.deleteAdmin(id);
  }

  @Get()
  listPublished(@Query('region') region?: string) {
    return this.servicePagesService.listPublished(region);
  }

  @Get('by-path')
  getPublishedByPath(@Query('path') path: string) {
    return this.servicePagesService.getPublishedByPath(path);
  }

  @Get(':region/:slug')
  getPublishedByRegionSlug(@Param('region') region: string, @Param('slug') slug: string) {
    return this.servicePagesService.getPublishedByRegionSlug(region, slug);
  }
}

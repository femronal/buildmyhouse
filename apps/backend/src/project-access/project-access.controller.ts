import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';
import {
  CreateManagedProjectDto,
  RequestAccessCodeDto,
  VerifyAccessCodeDto,
} from './dto/project-access.dto';
import { ProjectAccessService } from './project-access.service';

@Controller('project-access')
export class ProjectAccessController {
  constructor(private readonly projectAccessService: ProjectAccessService) {}

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listTemplates() {
    return this.projectAccessService.listTemplates();
  }

  @Post('admin/managed-projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createManagedProject(@Body() dto: CreateManagedProjectDto) {
    return this.projectAccessService.createManagedProject(dto);
  }

  @Get('admin/projects/:projectId/links')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getProjectLinks(@Param('projectId') projectId: string) {
    return this.projectAccessService.getProjectAccessLinks(projectId);
  }

  @Post('admin/projects/:projectId/generate-links')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  generateProjectLinks(@Param('projectId') projectId: string) {
    return this.projectAccessService.generateProjectTrackingLinks(projectId);
  }

  @Post('admin/links/:linkId/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  resendLink(@Param('linkId') linkId: string) {
    return this.projectAccessService.resendProjectLink(linkId);
  }

  @Get('link/:token/preview')
  getPreview(@Param('token') token: string) {
    return this.projectAccessService.getAccessPreview(token);
  }

  @Post('link/:token/request-code')
  requestCode(@Param('token') token: string, @Body() dto: RequestAccessCodeDto) {
    return this.projectAccessService.requestAccessCode(token, dto.email);
  }

  @Post('link/:token/verify')
  verifyCode(@Param('token') token: string, @Body() dto: VerifyAccessCodeDto) {
    return this.projectAccessService.verifyAccessCode(
      token,
      dto.email,
      dto.code,
      dto.acceptTerms,
    );
  }

  @Post('link/:token/claim')
  claimAccount(
    @Param('token') token: string,
    @Body()
    body: { email: string; password: string; fullName: string; phone?: string },
  ) {
    return this.projectAccessService.claimManagedAccount({
      accessToken: token,
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      phone: body.phone,
    });
  }
}

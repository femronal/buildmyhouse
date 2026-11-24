import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import { ChangeStageDto, CreateLeadDto, CreateMeetingDto, LeadContactDto, LinkPartnerDto, LogTouchDto, UpdateLeadDto, UpdateMeetingDto } from './dto/partnerships.dto';
import { PartnershipsService } from './partnerships.service';

@Controller('admin/partnerships')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class PartnershipsAdminController {
  constructor(private readonly partnerships: PartnershipsService) {}

  @Get('leads')
  @RequirePermissions('partnerships.view')
  list(@Req() req: any, @Query('q') q?: string, @Query('stage') stage?: string, @Query('status') status?: string, @Query('category') category?: string, @Query('ownerId') ownerId?: string, @Query('includeArchived') includeArchived?: string) {
    return this.partnerships.list(this.userId(req), { q, stage, status, category, ownerId, includeArchived: includeArchived === 'true' });
  }

  @Get('summary')
  @RequirePermissions('partnerships.view')
  summary(@Req() req: any, @Query('ownerId') ownerId?: string, @Query('category') category?: string) {
    return this.partnerships.summary(this.userId(req), { ownerId, category });
  }

  @Get('today')
  @RequirePermissions('partnerships.view')
  today(@Req() req: any, @Query('ownerId') ownerId?: string, @Query('category') category?: string) {
    return this.partnerships.today(this.userId(req), { ownerId, category });
  }

  @Get('owners')
  @RequirePermissions('partnerships.view')
  owners(@Req() req: any) {
    return this.partnerships.owners(this.userId(req));
  }

  @Get('dedupe')
  @RequirePermissions('partnerships.view')
  dedupe(@Req() req: any, @Query('email') email?: string, @Query('domain') domain?: string, @Query('name') name?: string) {
    return this.partnerships.dedupe(this.userId(req), { email, domain, name });
  }

  @Post('import/preview')
  @RequirePermissions('partnerships.manage')
  @UseInterceptors(FileInterceptor('file'))
  preview(@Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    return this.partnerships.previewImport(this.userId(req), file?.buffer?.toString('utf8') || '');
  }

  @Post('import/commit')
  @RequirePermissions('partnerships.manage')
  @UseInterceptors(FileInterceptor('file'))
  commit(@Req() req: any, @UploadedFile() file?: Express.Multer.File, @Body('payload') payload?: string) {
    let body: { ownerId?: string; rows?: { importKey: string; category?: string; importAnyway?: boolean }[] } = {};
    if (payload) {
      try {
        body = JSON.parse(payload);
      } catch {
        throw new BadRequestException('The import choices could not be read.');
      }
    }
    if (!body.ownerId) throw new BadRequestException('Choose an owner for the imported leads.');
    return this.partnerships.commitImport(this.userId(req), file?.buffer?.toString('utf8') || '', { ownerId: body.ownerId, rows: body.rows });
  }

  @Get('leads/:id')
  @RequirePermissions('partnerships.view')
  get(@Req() req: any, @Param('id') id: string) {
    return this.partnerships.get(this.userId(req), id);
  }

  @Post('leads')
  @RequirePermissions('partnerships.edit')
  create(@Req() req: any, @Body() body: CreateLeadDto) {
    return this.partnerships.create(this.userId(req), body);
  }

  @Patch('leads/:id')
  @RequirePermissions('partnerships.edit')
  update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateLeadDto) {
    return this.partnerships.update(this.userId(req), id, body);
  }

  @Post('leads/:id/stage')
  @RequirePermissions('partnerships.edit')
  stage(@Req() req: any, @Param('id') id: string, @Body() body: ChangeStageDto) {
    return this.partnerships.changeStage(this.userId(req), id, body);
  }

  @Post('leads/:id/archive')
  @RequirePermissions('partnerships.manage')
  archive(@Req() req: any, @Param('id') id: string) {
    return this.partnerships.archive(this.userId(req), id);
  }

  @Post('leads/:id/contacts')
  @RequirePermissions('partnerships.edit')
  addContact(@Req() req: any, @Param('id') id: string, @Body() body: LeadContactDto) {
    return this.partnerships.addContact(this.userId(req), id, body);
  }

  @Patch('contacts/:id')
  @RequirePermissions('partnerships.edit')
  updateContact(@Req() req: any, @Param('id') id: string, @Body() body: LeadContactDto) {
    return this.partnerships.updateContact(this.userId(req), id, body);
  }

  @Post('leads/:id/touches')
  @RequirePermissions('partnerships.edit')
  touch(@Req() req: any, @Param('id') id: string, @Body() body: LogTouchDto) {
    return this.partnerships.logTouch(this.userId(req), id, body);
  }

  @Post('leads/:id/meetings')
  @RequirePermissions('partnerships.edit')
  meeting(@Req() req: any, @Param('id') id: string, @Body() body: CreateMeetingDto) {
    return this.partnerships.addMeeting(this.userId(req), id, body);
  }

  @Patch('meetings/:id')
  @RequirePermissions('partnerships.edit')
  updateMeeting(@Req() req: any, @Param('id') id: string, @Body() body: UpdateMeetingDto) {
    return this.partnerships.updateMeeting(this.userId(req), id, body);
  }

  @Post('leads/:id/partner-link')
  @RequirePermissions('partnerships.manage')
  link(@Req() req: any, @Param('id') id: string, @Body() body: LinkPartnerDto) {
    return this.partnerships.linkPartner(this.userId(req), id, body.referrerId || null);
  }

  private userId(req: any) {
    return req.user?.sub || req.user?.id;
  }
}

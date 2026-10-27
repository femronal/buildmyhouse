import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectReviewDto } from './dto/update-project-review.dto';
import { SetExternalPaymentLinkDto } from './dto/set-external-payment-link.dto';
import { ConfirmManualPaymentDto } from './dto/confirm-manual-payment.dto';
import { SetPaymentModelDto } from './dto/set-payment-model.dto';
import { SetProjectRiskLevelDto } from './dto/set-project-risk-level.dto';
import { CreateStageDisputeDto } from './dto/create-stage-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { CreateStageChangeRequestDto } from './dto/create-stage-change-request.dto';
import { ReviewStageChangeRequestDto } from './dto/review-stage-change-request.dto';
import { ListStageChangeRequestsDto } from './dto/list-stage-change-requests.dto';
import { UpdateStageDetailsDto } from './dto/update-stage-details.dto';
import { CreateStageMaterialDto } from '../stages/dto/create-stage-material.dto';
import { UpdateStageMaterialDto } from '../stages/dto/update-stage-material.dto';
import { CreateStageTeamMemberDto } from '../stages/dto/create-stage-team-member.dto';
import { UpdateStageTeamMemberDto } from '../stages/dto/update-stage-team-member.dto';
import { UpdateProjectScopeDto } from './dto/update-project-scope.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  create(@Request() req: any, @Body() createProjectDto: CreateProjectDto) {
    const userId = req.user.sub;
    return this.projectsService.createProject(userId, createProjectDto);
  }

  @Post('from-design')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  createFromDesign(
    @Request() req: any,
    @Body() body: {
      designId: string;
      address: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      planImageUrl?: string;
      planImageUrls?: string[];
      planPdfUrl?: string;
      planFileName?: string;
      projectDescription?: string;
      successCriteria?: string;
      referralCode?: string;
      referralSource?: 'link' | 'code_entered';
    },
  ) {
    const userId = req.user.sub;
    return this.projectsService.createProjectFromDesign(
      userId,
      body.designId,
      body.address,
      body.street,
      body.city,
      body.state,
      body.zipCode,
      body.country,
      body.latitude,
      body.longitude,
      body.planImageUrl,
      body.planImageUrls,
      body.planPdfUrl,
      body.planFileName,
      body.projectDescription,
      body.successCriteria,
      body.referralCode,
      body.referralSource,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('needsExtraMonitoring') needsExtraMonitoring?: string,
    @Query('waitingForApproval') waitingForApproval?: string,
  ) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    // Admin can see all projects, others see only their own
    if (userRole === 'admin') {
      return this.projectsService.getAllProjects(
        status,
        includeArchived === 'true',
        needsExtraMonitoring === 'true',
        waitingForApproval === 'true',
      );
    }
    return this.projectsService.getUserProjects(userId, status);
  }

  @Post('admin/archive-stale-tests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  archiveStaleTestProjects() {
    return this.projectsService.archiveStaleTestProjectsAsAdmin();
  }

  // Stages route must come BEFORE :id route to avoid route matching conflicts
  @Patch(':projectId/stages/:stageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin', 'homeowner')
  async updateStage(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
    @Body() body: { status: 'not_started' | 'in_progress' | 'completed' | 'blocked' },
  ) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    // Verify user has permission
    const project = await this.projectsService.getProject(projectId);
    if (userRole !== 'admin' && (project as any).status === 'paused') {
      throw new ForbiddenException('Project is paused for admin inspection');
    }
    
    // Admins can always update
    if (userRole === 'admin') {
      return this.projectsService.updateStageStatus(projectId, stageId, body.status, userRole);
    }
    
    // Homeowners can only set status to 'in_progress' (approve payment) for their own projects
    if (userRole === 'homeowner') {
      if (project.homeownerId !== userId) {
        throw new ForbiddenException('You do not have permission to update stages for this project');
      }
      if (body.status !== 'in_progress') {
        throw new ForbiddenException('Homeowners can only approve payment (set status to in_progress)');
      }
      return this.projectsService.updateStageStatus(projectId, stageId, body.status, userRole);
    }
    
    // GCs can update if they're the contractor for this project
    if (userRole === 'general_contractor' && project.generalContractorId === userId) {
      return this.projectsService.updateStageStatus(projectId, stageId, body.status, userRole);
    }

    throw new ForbiddenException('You do not have permission to update stages for this project');
  }

  @Post(':projectId/stages/:stageId/request-start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'homeowner')
  requestStageStart(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
  ) {
    return this.projectsService.requestStageStart(projectId, stageId, {
      userId: req.user.sub,
      role: req.user.role,
    });
  }

  @Post(':projectId/stages/:stageId/confirm-funding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  confirmStageFunding(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.projectsService.confirmStageFunding(projectId, stageId);
  }

  @Post(':projectId/stages/:stageId/submit-for-approval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async submitStageForApproval(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
  ) {
    const project = await this.projectsService.getProject(projectId);
    if (project.generalContractorId !== req.user.sub) {
      throw new ForbiddenException('You do not have permission to update stages for this project');
    }
    return this.projectsService.submitStageForApproval(projectId, stageId);
  }

  @Post(':projectId/stages/:stageId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  async approveStage(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
  ) {
    return this.projectsService.approveStage({
      projectId,
      stageId,
      approverId: req.user.sub,
      method: 'homeowner_app',
    });
  }

  @Post(':projectId/stages/:stageId/approve-on-behalf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async approveStageOnBehalf(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
    @Body() body: { note?: string; evidenceUrl?: string },
  ) {
    return this.projectsService.approveStage({
      projectId,
      stageId,
      approverId: req.user.sub,
      method: 'admin_on_behalf',
      note: body?.note,
      evidenceUrl: body?.evidenceUrl,
    });
  }

  @Patch(':projectId/stages/:stageId/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStageDetails(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Body() body: UpdateStageDetailsDto,
  ) {
    return this.projectsService.updateStageDetailsAsAdmin(projectId, stageId, body);
  }

  // ==================== Stage Documentation Endpoints ====================

  // Team Members
  @Post(':projectId/stages/:stageId/team-members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async addTeamMember(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
    @Body() body: CreateStageTeamMemberDto,
  ) {
    const userId = req.user.sub;
    const project = await this.projectsService.getProject(projectId);
    if (project.generalContractorId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to add team members');
    }
    return this.projectsService.addStageTeamMember(stageId, body, req.user.role);
  }

  @Get(':projectId/stages/:stageId/team-members')
  @UseGuards(JwtAuthGuard)
  async getTeamMembers(@Param('stageId') stageId: string, @Request() req: any) {
    return this.projectsService.getStageTeamMembers(stageId, req.user?.role === 'admin');
  }

  @Patch('stages/team-members/:teamMemberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async updateTeamMember(@Param('teamMemberId') teamMemberId: string, @Request() req: any, @Body() body: UpdateStageTeamMemberDto) {
    return this.projectsService.updateStageTeamMember(teamMemberId, body, req.user.role);
  }

  @Delete('stages/team-members/:teamMemberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async deleteTeamMember(@Param('teamMemberId') teamMemberId: string) {
    return this.projectsService.deleteStageTeamMember(teamMemberId);
  }

  // Materials
  @Post(':projectId/stages/:stageId/materials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async addMaterial(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
    @Body() body: CreateStageMaterialDto,
  ) {
    const userId = req.user.sub;
    const project = await this.projectsService.getProject(projectId);
    if (project.generalContractorId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to add materials');
    }
    return this.projectsService.addStageMaterial(stageId, body, req.user.role);
  }

  @Get(':projectId/stages/:stageId/materials')
  @UseGuards(JwtAuthGuard)
  async getMaterials(@Param('stageId') stageId: string, @Request() req: any) {
    return this.projectsService.getStageMaterials(stageId, req.user?.role === 'admin');
  }

  @Patch('stages/materials/:materialId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async updateMaterial(@Param('materialId') materialId: string, @Request() req: any, @Body() body: UpdateStageMaterialDto) {
    return this.projectsService.updateStageMaterial(materialId, body, req.user.role);
  }

  @Delete('stages/materials/:materialId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async deleteMaterial(@Param('materialId') materialId: string) {
    return this.projectsService.deleteStageMaterial(materialId);
  }

  // Media
  @Post(':projectId/stages/:stageId/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async addMedia(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    const userId = req.user.sub;
    const project = await this.projectsService.getProject(projectId);
    if (project.generalContractorId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to add media');
    }
    return this.projectsService.addStageMedia(stageId, body);
  }

  @Get(':projectId/stages/:stageId/media')
  @UseGuards(JwtAuthGuard)
  async getMedia(@Param('stageId') stageId: string) {
    return this.projectsService.getStageMedia(stageId);
  }

  @Patch('stages/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async updateMedia(@Param('mediaId') mediaId: string, @Body() body: any) {
    return this.projectsService.updateStageMedia(mediaId, body);
  }

  @Delete('stages/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async deleteMedia(@Param('mediaId') mediaId: string) {
    return this.projectsService.deleteStageMedia(mediaId);
  }

  // Documents
  @Post(':projectId/stages/:stageId/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async addDocument(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    const userId = req.user.sub;
    const project = await this.projectsService.getProject(projectId);
    if (project.generalContractorId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to add documents');
    }
    return this.projectsService.addStageDocument(stageId, body);
  }

  @Get(':projectId/stages/:stageId/documents')
  @UseGuards(JwtAuthGuard)
  async getDocuments(@Param('stageId') stageId: string) {
    return this.projectsService.getStageDocuments(stageId);
  }

  @Patch('stages/documents/:documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async updateDocument(@Param('documentId') documentId: string, @Body() body: any) {
    return this.projectsService.updateStageDocument(documentId, body);
  }

  @Delete('stages/documents/:documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async deleteDocument(@Param('documentId') documentId: string) {
    return this.projectsService.deleteStageDocument(documentId);
  }

  @Post(':projectId/stages/:stageId/disputes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  createStageDispute(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
    @Body() dto: CreateStageDisputeDto,
  ) {
    return this.projectsService.createStageDispute({
      projectId,
      stageId,
      homeownerId: req.user.sub,
      reasons: dto.reasons,
      otherReason: dto.otherReason,
    });
  }

  @Get('disputes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminDisputes(@Query('status') status?: 'open' | 'in_review' | 'resolved') {
    return this.projectsService.getAdminDisputes(status);
  }

  @Patch('disputes/:disputeId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateDisputeStatus(
    @Param('disputeId') disputeId: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.projectsService.updateDisputeStatus({
      disputeId,
      status: dto.status,
      resolutionNotes: dto.resolutionNotes,
    });
  }

  @Get('me/invoice-files')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  getMyInvoiceFiles(@Request() req: any) {
    return this.projectsService.getHomeownerInvoiceAndReceiptFiles(req.user.sub);
  }

  @Post(':projectId/stages/:stageId/change-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  createStageChangeRequest(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Request() req: any,
    @Body() dto: CreateStageChangeRequestDto,
  ) {
    return this.projectsService.createStageChangeRequest({
      projectId,
      stageId,
      requestedById: req.user.sub,
      actorRole: req.user.role,
      ...dto,
    });
  }

  @Get('stage-change-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStageChangeRequests(@Query() query: ListStageChangeRequestsDto) {
    return this.projectsService.getStageChangeRequests(query.status);
  }

  @Patch('stage-change-requests/:requestId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  reviewStageChangeRequest(
    @Param('requestId') requestId: string,
    @Request() req: any,
    @Body() dto: ReviewStageChangeRequestDto,
  ) {
    return this.projectsService.reviewStageChangeRequest({
      requestId,
      reviewedById: req.user.sub,
      decision: dto.decision,
      adminReviewNote: dto.adminReviewNote,
    });
  }

  @Get(':id/money-summary')
  @UseGuards(JwtAuthGuard)
  async moneySummary(@Param('id') id: string, @Request() req: any) {
    await this.findOne(id, req);
    return this.projectsService.getProjectMoneySummary(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    const viewer = userRole === 'admin' ? 'admin' : userRole === 'general_contractor' ? 'gc' : 'homeowner';
    const project = await this.projectsService.getProject(id, viewer);

    // Check authorization: user must be homeowner, contractor, admin, or subcontractor with accepted request
    if (userRole === 'admin') {
      return project;
    }

    if ((project as any).status === 'paused') {
      throw new ForbiddenException('Project is paused for admin inspection');
    }

    if (project.homeownerId === userId || project.generalContractorId === userId) {
      return project;
    }

    // Check if user is a subcontractor with an accepted request for this project
    if (userRole === 'subcontractor') {
      const hasAcceptedRequest = await this.projectsService.hasAcceptedRequestForProject(userId, id);
      if (hasAcceptedRequest) {
        return project;
      }
    }

    throw new ForbiddenException('You do not have permission to view this project');
  }

  // ==================== Homebuilding manual payment flow ====================

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateReviewStatus(@Param('id') id: string, @Body() dto: UpdateProjectReviewDto) {
    return this.projectsService.updateProjectReviewStatus({
      projectId: id,
      reviewStatus: dto.reviewStatus,
    });
  }

  @Patch(':id/risk-level')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  setRiskLevel(@Param('id') id: string, @Body() dto: SetProjectRiskLevelDto) {
    return this.projectsService.setProjectRiskLevel({
      projectId: id,
      riskLevel: dto.riskLevel,
    });
  }

  /**
   * Admin override: activate a pending_payment project (bypass payment modal).
   */
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  activateProject(@Param('id') id: string) {
    return this.projectsService.activateProjectAsAdmin({ projectId: id });
  }

  /**
   * Admin override: deactivate (pause/lock) a project for investigation.
   * When paused, homeowner/GC should not be able to open the project.
   */
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deactivateProject(@Param('id') id: string) {
    return this.projectsService.deactivateProjectAsAdmin({ projectId: id });
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  archiveProject(@Param('id') id: string) {
    return this.projectsService.archiveProjectAsAdmin({ projectId: id });
  }

  @Patch(':id/unarchive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  unarchiveProject(@Param('id') id: string) {
    return this.projectsService.unarchiveProjectAsAdmin({ projectId: id });
  }

  @Patch(':id/external-payment-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  setExternalPaymentLink(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: SetExternalPaymentLinkDto,
  ) {
    return this.projectsService.setExternalPaymentLink({
      projectId: id,
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      externalPaymentLink: dto.externalPaymentLink,
    });
  }

  @Post(':id/payment/declare')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  declareManualPayment(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.declareManualPayment({
      projectId: id,
      homeownerId: req.user.sub,
    });
  }

  @Patch(':id/payment/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  confirmManualPayment(
    @Param('id') id: string,
    @Body() dto: ConfirmManualPaymentDto,
  ) {
    return this.projectsService.confirmManualPayment({ projectId: id, amount: dto.amount });
  }

  @Patch(':id/payment-model')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  setPaymentModel(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: SetPaymentModelDto,
  ) {
    return this.projectsService.setPaymentModel({
      projectId: id,
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      paymentModel: dto.paymentModel,
      paymentComplete: dto.paymentComplete === true,
    });
  }

  @Patch(':id/scope')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateProjectScope(@Param('id') id: string, @Body() body: UpdateProjectScopeDto) {
    return this.projectsService.updateProjectScopeAsAdmin(id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'admin')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const userId = req.user.sub;
    return this.projectsService.updateProject(id, userId, updateProjectDto, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'admin')
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    return this.projectsService.deleteProject(id, userId, userRole);
  }
}




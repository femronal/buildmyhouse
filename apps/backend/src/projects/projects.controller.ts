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
import { SetProjectRiskLevelDto } from './dto/set-project-risk-level.dto';
import { CreateStageDisputeDto } from './dto/create-stage-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
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
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: any, @Query('status') status?: string) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    // Admin can see all projects, others see only their own
    if (userRole === 'admin') {
      return this.projectsService.getAllProjects(status);
    }
    return this.projectsService.getUserProjects(userId, status);
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
      return this.projectsService.updateStageStatus(projectId, stageId, body.status);
    }
    
    // Homeowners can only set status to 'in_progress' (approve payment) for their own projects
    if (userRole === 'homeowner') {
      if (project.homeownerId !== userId) {
        throw new ForbiddenException('You do not have permission to update stages for this project');
      }
      if (body.status !== 'in_progress') {
        throw new ForbiddenException('Homeowners can only approve payment (set status to in_progress)');
      }
      return this.projectsService.updateStageStatus(projectId, stageId, body.status);
    }
    
    // GCs can update if they're the contractor for this project
    if (userRole === 'general_contractor' && project.generalContractorId === userId) {
      return this.projectsService.updateStageStatus(projectId, stageId, body.status);
    }

    throw new ForbiddenException('You do not have permission to update stages for this project');
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
    @Body() body: any,
  ) {
    const userId = req.user.sub;
    const project = await this.projectsService.getProject(projectId);
    if (project.generalContractorId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to add team members');
    }
    return this.projectsService.addStageTeamMember(stageId, body);
  }

  @Get(':projectId/stages/:stageId/team-members')
  @UseGuards(JwtAuthGuard)
  async getTeamMembers(@Param('stageId') stageId: string) {
    return this.projectsService.getStageTeamMembers(stageId);
  }

  @Patch('stages/team-members/:teamMemberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async updateTeamMember(@Param('teamMemberId') teamMemberId: string, @Body() body: any) {
    return this.projectsService.updateStageTeamMember(teamMemberId, body);
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
    @Body() body: any,
  ) {
    const userId = req.user.sub;
    const project = await this.projectsService.getProject(projectId);
    if (project.generalContractorId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to add materials');
    }
    return this.projectsService.addStageMaterial(stageId, body);
  }

  @Get(':projectId/stages/:stageId/materials')
  @UseGuards(JwtAuthGuard)
  async getMaterials(@Param('stageId') stageId: string) {
    return this.projectsService.getStageMaterials(stageId);
  }

  @Patch('stages/materials/:materialId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async updateMaterial(@Param('materialId') materialId: string, @Body() body: any) {
    return this.projectsService.updateStageMaterial(materialId, body);
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    const project = await this.projectsService.getProject(id);

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
    @Body() _dto: ConfirmManualPaymentDto,
  ) {
    return this.projectsService.confirmManualPayment({ projectId: id });
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
    return this.projectsService.updateProject(id, userId, updateProjectDto);
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




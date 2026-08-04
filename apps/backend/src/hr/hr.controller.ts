import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from './permissions/permissions.guard';
import { RequirePermissions } from './permissions/require-permissions.decorator';
import { HrService } from './hr.service';
import {
  AcknowledgePolicyDto,
  AssignStaffRoleDto,
  ChangeCandidateStageDto,
  CreateCandidateDto,
  CreateDepartmentDto,
  CreateDocumentDto,
  CreatePerformanceGoalDto,
  CreatePolicyDto,
  CreatePositionDto,
  CreateStaffDto,
  CreateStaffLoginDto,
  HireCandidateDto,
  OffboardStaffDto,
  SendHrCommunicationDto,
  UpdateCandidateDto,
  UpdateDepartmentDto,
  UpdateOnboardingTaskDto,
  UpdatePerformanceGoalDto,
  UpdatePolicyDto,
  UpdatePositionDto,
  UpdateStaffDto,
  UpsertAdminRoleDto,
} from './dto/hr.dto';

@Controller('admin/hr')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class HrController {
  constructor(private readonly hr: HrService) {}

  /** Any dashboard admin can inspect their effective permission set. */
  @Get('me/permissions')
  getMyPermissions(@Request() req: any) {
    return this.hr.getMyPermissions(req.user.sub);
  }

  @Get('dashboard')
  @RequirePermissions('hr.view')
  getDashboard(@Request() req: any) {
    return this.hr.getDashboard(req.user.sub);
  }

  // Structure
  @Get('departments')
  @RequirePermissions('hr.view')
  listDepartments() {
    return this.hr.listDepartments();
  }

  @Post('departments')
  @RequirePermissions('hr.people.manage')
  createDepartment(@Request() req: any, @Body() dto: CreateDepartmentDto) {
    return this.hr.createDepartment(req.user.sub, dto);
  }

  @Patch('departments/:id')
  @RequirePermissions('hr.people.manage')
  updateDepartment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.hr.updateDepartment(req.user.sub, id, dto);
  }

  @Get('positions')
  @RequirePermissions('hr.view')
  listPositions() {
    return this.hr.listPositions();
  }

  @Post('positions')
  @RequirePermissions('hr.people.manage')
  createPosition(@Request() req: any, @Body() dto: CreatePositionDto) {
    return this.hr.createPosition(req.user.sub, dto);
  }

  @Patch('positions/:id')
  @RequirePermissions('hr.people.manage')
  updatePosition(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.hr.updatePosition(req.user.sub, id, dto);
  }

  // Candidates
  @Get('candidates')
  @RequirePermissions('hr.view')
  listCandidates(@Query('stage') stage?: string) {
    return this.hr.listCandidates(stage);
  }

  @Get('candidates/:id')
  @RequirePermissions('hr.view')
  getCandidate(@Param('id') id: string) {
    return this.hr.getCandidate(id);
  }

  @Post('candidates')
  @RequirePermissions('hr.candidates.manage')
  createCandidate(@Request() req: any, @Body() dto: CreateCandidateDto) {
    return this.hr.createCandidate(req.user.sub, dto);
  }

  @Patch('candidates/:id')
  @RequirePermissions('hr.candidates.manage')
  updateCandidate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.hr.updateCandidate(req.user.sub, id, dto);
  }

  @Patch('candidates/:id/stage')
  @RequirePermissions('hr.candidates.manage')
  changeStage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ChangeCandidateStageDto,
  ) {
    return this.hr.changeCandidateStage(req.user.sub, id, dto);
  }

  @Post('candidates/:id/hire')
  @RequirePermissions('hr.candidates.manage', 'hr.people.manage')
  hireCandidate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: HireCandidateDto,
  ) {
    return this.hr.hireCandidate(req.user.sub, id, dto);
  }

  // People
  @Get('people')
  @RequirePermissions('hr.view')
  listPeople(@Request() req: any, @Query('q') q?: string) {
    return this.hr.listPeople(req.user.sub, q);
  }

  @Get('people/:id')
  @RequirePermissions('hr.view')
  getPerson(@Request() req: any, @Param('id') id: string) {
    return this.hr.getStaffForActor(req.user.sub, id);
  }

  @Post('people')
  @RequirePermissions('hr.people.manage')
  createPerson(@Request() req: any, @Body() dto: CreateStaffDto) {
    return this.hr.createStaff(req.user.sub, dto);
  }

  @Patch('people/:id')
  @RequirePermissions('hr.people.manage')
  updatePerson(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.hr.updateStaff(req.user.sub, id, dto);
  }

  @Patch('people/:id/onboarding/:taskId')
  @RequirePermissions('hr.people.manage')
  updateOnboarding(
    @Request() req: any,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateOnboardingTaskDto,
  ) {
    return this.hr.updateOnboardingTask(req.user.sub, id, taskId, dto);
  }

  @Post('people/:id/offboard')
  @RequirePermissions('hr.people.manage')
  offboard(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: OffboardStaffDto,
  ) {
    return this.hr.offboardStaff(req.user.sub, id, dto);
  }

  @Post('people/:id/login')
  @RequirePermissions('hr.people.manage', 'hr.permissions.manage')
  createLogin(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateStaffLoginDto,
  ) {
    return this.hr.createStaffLogin(req.user.sub, id, dto);
  }

  @Post('people/:id/roles')
  @RequirePermissions('hr.permissions.manage')
  assignRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AssignStaffRoleDto,
  ) {
    return this.hr.assignStaffRole(req.user.sub, id, dto);
  }

  @Post('people/:id/roles/:assignmentId/revoke')
  @RequirePermissions('hr.permissions.manage')
  revokeRole(
    @Request() req: any,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.hr.revokeStaffRole(req.user.sub, id, assignmentId);
  }

  // Permissions catalog / roles
  @Get('permissions')
  @RequirePermissions('hr.view')
  listPermissions() {
    return this.hr.listPermissionCatalog();
  }

  @Get('roles')
  @RequirePermissions('hr.view')
  listRoles() {
    return this.hr.listRoles();
  }

  @Post('roles')
  @RequirePermissions('hr.permissions.manage')
  upsertRole(@Request() req: any, @Body() dto: UpsertAdminRoleDto) {
    return this.hr.upsertRole(req.user.sub, dto);
  }

  // Documents
  @Get('documents')
  @RequirePermissions('hr.view')
  listDocuments(
    @Query('staffProfileId') staffProfileId?: string,
    @Query('candidateId') candidateId?: string,
  ) {
    return this.hr.listDocuments({ staffProfileId, candidateId });
  }

  @Post('documents')
  @RequirePermissions('hr.documents.manage')
  createDocument(@Request() req: any, @Body() dto: CreateDocumentDto) {
    return this.hr.createDocument(req.user.sub, dto);
  }

  @Post('documents/:id/archive')
  @RequirePermissions('hr.documents.manage')
  archiveDocument(@Request() req: any, @Param('id') id: string) {
    return this.hr.archiveDocument(req.user.sub, id);
  }

  // Performance
  @Get('performance')
  @RequirePermissions('hr.view')
  listPerformance(@Query('staffProfileId') staffProfileId?: string) {
    return this.hr.listPerformanceGoals(staffProfileId);
  }

  @Post('performance')
  @RequirePermissions('hr.performance.manage')
  createPerformance(@Request() req: any, @Body() dto: CreatePerformanceGoalDto) {
    return this.hr.createPerformanceGoal(req.user.sub, dto);
  }

  @Patch('performance/:id')
  @RequirePermissions('hr.performance.manage')
  updatePerformance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceGoalDto,
  ) {
    return this.hr.updatePerformanceGoal(req.user.sub, id, dto);
  }

  // Policies
  @Get('policies')
  @RequirePermissions('hr.view')
  listPolicies() {
    return this.hr.listPolicies();
  }

  @Get('policies/:id')
  @RequirePermissions('hr.view')
  getPolicy(@Param('id') id: string) {
    return this.hr.getPolicy(id);
  }

  @Post('policies')
  @RequirePermissions('hr.policies.manage')
  createPolicy(@Request() req: any, @Body() dto: CreatePolicyDto) {
    return this.hr.createPolicy(req.user.sub, dto);
  }

  @Patch('policies/:id')
  @RequirePermissions('hr.policies.manage')
  updatePolicy(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.hr.updatePolicy(req.user.sub, id, dto);
  }

  @Post('policies/:id/acknowledge')
  @RequirePermissions('hr.policies.manage')
  acknowledgePolicy(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AcknowledgePolicyDto,
  ) {
    return this.hr.acknowledgePolicy(req.user.sub, id, dto);
  }

  // Communications
  @Get('communications/templates')
  @RequirePermissions('hr.view')
  listTemplates() {
    return this.hr.listCommunicationTemplates();
  }

  @Get('communications')
  @RequirePermissions('hr.view')
  listCommunications(
    @Query('candidateId') candidateId?: string,
    @Query('staffProfileId') staffProfileId?: string,
  ) {
    return this.hr.listCommunications({ candidateId, staffProfileId });
  }

  @Post('communications/send')
  @RequirePermissions('emails.send', 'hr.view')
  sendCommunication(@Request() req: any, @Body() dto: SendHrCommunicationDto) {
    return this.hr.sendCommunication(req.user.sub, dto);
  }

  // Audit
  @Get('audit-log')
  @RequirePermissions('hr.view')
  listAudit(
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.hr.listAudit({
      limit: limit ? Number(limit) : undefined,
      entityType,
      entityId,
    });
  }
}

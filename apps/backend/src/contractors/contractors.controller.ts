import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';
import { CreateConnectAccountLinkDto } from './dto/create-connect-account-link.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';

@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async getGCProfile(@Request() req: any) {
    const userId = req.user.sub;
    return this.contractorsService.getGCProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async updateGCProfile(@Request() req: any, @Body() body: { experienceYears?: number }) {
    const userId = req.user.sub;
    return this.contractorsService.updateGCProfile(userId, body);
  }

  @Get('certifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async listCertifications(@Request() req: any) {
    const userId = req.user.sub;
    return this.contractorsService.listCertifications(userId);
  }

  @Post('certifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async createCertification(
    @Request() req: any,
    @Body() body: { name: string; fileUrl: string; expiryYear?: string },
  ) {
    const userId = req.user.sub;
    return this.contractorsService.createCertification(userId, body);
  }

  @Delete('certifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async deleteCertification(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    await this.contractorsService.deleteCertification(userId, id);
  }

  @Get('bank-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async listBankAccounts(@Request() req: any) {
    const userId = req.user.sub;
    return this.contractorsService.listBankAccounts(userId);
  }

  @Get('bank-accounts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async getBankAccount(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.contractorsService.getBankAccount(userId, id);
  }

  @Post('bank-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async createBankAccount(@Request() req: any, @Body() body: CreateBankAccountDto) {
    const userId = req.user.sub;
    return this.contractorsService.createBankAccount(userId, body);
  }

  @Patch('bank-accounts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async updateBankAccount(@Request() req: any, @Param('id') id: string, @Body() body: { bankName?: string; accountNumber?: string; accountOwnerName?: string }) {
    const userId = req.user.sub;
    return this.contractorsService.updateBankAccount(userId, id, body);
  }

  @Delete('bank-accounts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async deleteBankAccount(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.contractorsService.deleteBankAccount(userId, id);
  }

  @Get('recommend/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  async recommendGCs(@Param('projectId') projectId: string) {
    return this.contractorsService.recommendGCs(projectId, 3);
  }

  @Post('requests/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor')
  async sendRequests(
    @Body() body: { 
      projectId: string; 
      contractorIds: string[];
      stageId?: string;
      workDetails?: string;
      estimatedBudget?: number;
      estimatedDuration?: string;
    },
    @Request() req: any,
  ) {
    const senderId = req.user.sub; // Get the authenticated user (GC) who is sending
    return this.contractorsService.sendProjectRequests(
      body.projectId,
      body.contractorIds,
      body.stageId,
      body.workDetails,
      body.estimatedBudget,
      body.estimatedDuration,
      senderId, // Pass the GC's ID
    );
  }

  @Get('requests/project/:projectId/accepted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  async getAcceptedSubcontractors(@Param('projectId') projectId: string) {
    return this.contractorsService.getAcceptedSubcontractors(projectId);
  }

  @Get('projects/accepted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('subcontractor')
  async getAcceptedProjects(@Request() req: any) {
    const subcontractorId = req.user.sub;
    return this.contractorsService.getAcceptedProjectsForSubcontractor(subcontractorId);
  }

  @Get('requests/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'subcontractor')
  async getPendingRequests(@Request() req: any) {
    const contractorId = req.user.sub;
    return this.contractorsService.getPendingRequests(contractorId);
  }

  @Get('requests/sent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async getSentRequests(@Request() req: any) {
    const gcId = req.user.sub;
    return this.contractorsService.getSentRequests(gcId);
  }

  @Get('requests/accepted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'subcontractor')
  async getAcceptedContractors(@Request() req: any) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    if (userRole === 'general_contractor') {
      return this.contractorsService.getAcceptedContractorsForGC(userId);
    } else {
      // For subcontractors, get the GCs they've accepted requests from
      return this.contractorsService.getAcceptedGCsForSubcontractor(userId);
    }
  }

  @Post('requests/:requestId/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'subcontractor')
  async acceptRequest(
    @Param('requestId') requestId: string,
    @Request() req: any,
    @Body()
    body: {
      estimatedBudget?: number;
      estimatedDuration?: string;
      gcNotes?: string;
    },
  ) {
    const contractorId = req.user.sub;
    return this.contractorsService.acceptRequest(
      requestId,
      contractorId,
      body.estimatedBudget,
      body.estimatedDuration,
      body.gcNotes,
    );
  }

  @Post('requests/:requestId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'subcontractor')
  async rejectRequest(
    @Param('requestId') requestId: string,
    @Request() req: any,
    @Body() body: { reason?: string },
  ) {
    const contractorId = req.user.sub;
    return this.contractorsService.rejectRequest(
      requestId,
      contractorId,
      body.reason,
    );
  }

  @Delete('requests/:requestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async deleteRequest(
    @Param('requestId') requestId: string,
    @Request() req: any,
  ) {
    const gcId = req.user.sub;
    return this.contractorsService.deleteRequest(requestId, gcId);
  }

  /**
   * Stripe Connect (GC onboarding)
   */
  @Post('connect/account')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async createConnectAccount(@Request() req: any) {
    const userId = req.user.sub;
    return this.contractorsService.createOrGetConnectAccountForGC(userId);
  }

  @Post('connect/account-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async createConnectAccountLink(
    @Request() req: any,
    @Body() body: CreateConnectAccountLinkDto,
  ) {
    const userId = req.user.sub;
    return this.contractorsService.createConnectAccountLinkForGC(userId, {
      returnUrl: body.returnUrl,
      refreshUrl: body.refreshUrl,
    });
  }

  @Get('connect/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async getConnectStatus(@Request() req: any) {
    const userId = req.user.sub;
    return this.contractorsService.getConnectStatusForGC(userId);
  }

  /**
   * Stripe Connect (admin helpers)
   * Admin can generate onboarding links / view status for a GC.
   */
  @Post('admin/:userId/connect/account')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminCreateConnectAccount(@Param('userId') userId: string) {
    return this.contractorsService.createOrGetConnectAccountForGC(userId);
  }

  @Post('admin/:userId/connect/account-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminCreateConnectAccountLink(
    @Param('userId') userId: string,
    @Body() body: CreateConnectAccountLinkDto,
  ) {
    return this.contractorsService.createConnectAccountLinkForGC(userId, {
      returnUrl: body.returnUrl,
      refreshUrl: body.refreshUrl,
    });
  }

  @Get('admin/:userId/connect/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminGetConnectStatus(@Param('userId') userId: string) {
    return this.contractorsService.getConnectStatusForGC(userId);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminListGCs(@Request() req: any) {
    return this.contractorsService.adminListGCs();
  }

  @Get('admin/unverified-gcs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminListUnverifiedGCs() {
    return this.contractorsService.adminListUnverifiedGCs();
  }

  @Post('admin/:userId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminVerifyGC(@Param('userId') userId: string) {
    return this.contractorsService.adminVerifyGC(userId);
  }

  @Get('admin/:userId/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminGetGCProfile(@Param('userId') userId: string) {
    return this.contractorsService.getGCProfile(userId);
  }

  @Get('admin/:userId/bank-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminGetBankAccounts(@Param('userId') userId: string) {
    return this.contractorsService.adminListBankAccounts(userId);
  }

  @Get('earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async getEarnings(@Request() req: any) {
    const userId = req.user?.sub;
    return this.contractorsService.getGCEarnings(userId);
  }
}



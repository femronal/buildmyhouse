import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';

@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

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
}



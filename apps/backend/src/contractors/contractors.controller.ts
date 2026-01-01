import {
  Controller,
  Get,
  Post,
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
  @Roles('homeowner')
  async sendRequests(
    @Body() body: { projectId: string; contractorIds: string[] },
  ) {
    return this.contractorsService.sendProjectRequests(
      body.projectId,
      body.contractorIds,
    );
  }

  @Get('requests/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
  async getPendingRequests(@Request() req: any) {
    const contractorId = req.user.sub;
    return this.contractorsService.getPendingRequests(contractorId);
  }

  @Post('requests/:requestId/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor')
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
  @Roles('general_contractor')
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
}



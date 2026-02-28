import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { RejectDesignDto } from './dto/reject-design.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';

@Controller('designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  /**
   * Public list of designs for Explore.
   * (Auth token is optional on the client; we keep this unguarded.)
   */
  @Get()
  getAllDesigns() {
    return this.designsService.getAllDesigns();
  }

  /**
   * GC/Admin: get designs created by the current user.
   * NOTE: Must be defined before `:id` route.
   */
  @Get('my-designs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  getMyDesigns(@Request() req: any) {
    const userId = req.user?.sub;
    return this.designsService.getMyDesigns(userId);
  }

  /**
   * Admin: list plans pending verification before going live.
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getPendingDesigns(@Request() req: any) {
    const role = req.user?.role;
    return this.designsService.getPendingDesignsForAdmin({ actorRole: role });
  }

  /**
   * Admin: approve a design and make it live for homeowners.
   */
  @Patch('admin/:id/go-live')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  approveDesignGoLive(@Param('id') id: string, @Request() req: any) {
    const adminUserId = req.user?.sub;
    const role = req.user?.role;
    return this.designsService.approveDesignGoLive({
      designId: id,
      adminUserId,
      actorRole: role,
    });
  }

  /**
   * Admin: reject a design plan with reason.
   */
  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  rejectDesign(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: RejectDesignDto,
  ) {
    const adminUserId = req.user?.sub;
    const role = req.user?.role;
    return this.designsService.rejectDesignPlan({
      designId: id,
      adminUserId,
      actorRole: role,
      reason: body.reason,
    });
  }

  @Get(':id')
  getDesignById(@Param('id') id: string) {
    return this.designsService.getDesignById(id);
  }

  /**
   * Create a new design (GC/Admin).
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  createDesign(@Request() req: any, @Body() dto: CreateDesignDto) {
    const userId = req.user?.sub;
    return this.designsService.createDesign(userId, dto);
  }

  /**
   * GC/Admin: update a design.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  updateDesign(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.sub;
    const role = req.user?.role;
    return this.designsService.updateDesign({ designId: id, actorUserId: userId, actorRole: role, data: body });
  }

  /**
   * GC/Admin: delete a design.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  deleteDesign(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub;
    const role = req.user?.role;
    return this.designsService.deleteDesign({ designId: id, actorUserId: userId, actorRole: role });
  }
}


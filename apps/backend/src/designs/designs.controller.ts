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


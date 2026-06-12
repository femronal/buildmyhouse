import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { UpsertResourceSectionDto } from './dto/upsert-resource-section.dto';
import { ResourceSectionsService } from './resource-sections.service';

@Controller('resource-sections')
export class ResourceSectionsController {
  constructor(private readonly resourceSectionsService: ResourceSectionsService) {}

  @Get()
  listPublic() {
    return this.resourceSectionsService.listPublic();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin() {
    return this.resourceSectionsService.listAdmin();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createAdmin(@Body() dto: UpsertResourceSectionDto) {
    return this.resourceSectionsService.createAdmin(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateAdmin(@Param('id') id: string, @Body() dto: UpsertResourceSectionDto) {
    return this.resourceSectionsService.updateAdmin(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteAdmin(@Param('id') id: string) {
    return this.resourceSectionsService.deleteAdmin(id);
  }
}

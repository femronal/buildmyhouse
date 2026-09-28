import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import { VendorCategoriesService } from './vendor-categories.service';

class CategoryBodyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

class CategoryPatchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class ReorderItemDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}

class MergeDto {
  @IsString()
  intoId!: string;
}

@Controller('admin/vendor-categories')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class VendorCategoriesAdminController {
  constructor(private readonly categories: VendorCategoriesService) {}

  @Get()
  @RequirePermissions('vendors.view')
  tree() {
    return this.categories.tree(true);
  }

  @Post()
  @RequirePermissions('vendors.edit')
  create(@Req() req: any, @Body() dto: CategoryBodyDto) {
    return this.categories.create(dto, req.user.sub);
  }

  @Patch('reorder')
  @RequirePermissions('vendors.edit')
  reorder(@Req() req: any, @Body() dto: ReorderDto) {
    return this.categories.reorder(
      dto.items.map((item, index) => ({ id: item.id, sortOrder: item.sortOrder ?? index })),
      req.user.sub,
    );
  }

  @Patch(':id')
  @RequirePermissions('vendors.edit')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: CategoryPatchDto) {
    return this.categories.update(id, dto, req.user.sub);
  }

  @Post(':id/merge')
  @RequirePermissions('vendors.edit')
  merge(@Req() req: any, @Param('id') id: string, @Body() dto: MergeDto) {
    return this.categories.merge(id, dto.intoId, req.user.sub);
  }

  @Delete(':id')
  @RequirePermissions('vendors.edit')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.categories.remove(id, req.user.sub);
  }
}

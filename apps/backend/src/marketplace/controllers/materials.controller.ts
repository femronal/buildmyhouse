import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MaterialsService } from '../services/materials.service';
import { CreateMaterialDto } from '../dto/create-material.dto';
import { UpdateMaterialDto } from '../dto/update-material.dto';
import { SearchDto } from '../dto/search.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/rbac.guard';

@Controller('marketplace/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin')
  create(@Request() req: any, @Body() createMaterialDto: CreateMaterialDto) {
    const vendorId = req.user?.sub;
    return this.materialsService.create(vendorId, createMaterialDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchDto) {
    return this.materialsService.findAll(searchDto);
  }

  @Get('search')
  search(@Query() searchDto: SearchDto) {
    return this.materialsService.findAll(searchDto);
  }

  @Get('vendor/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin')
  getMyMaterials(@Request() req: any) {
    const vendorId = req.user?.sub;
    return this.materialsService.getVendorMaterials(vendorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    const vendorId = req.user?.sub;
    return this.materialsService.update(id, vendorId, updateMaterialDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin')
  remove(@Param('id') id: string, @Request() req: any) {
    const vendorId = req.user?.sub;
    return this.materialsService.remove(id, vendorId);
  }
}


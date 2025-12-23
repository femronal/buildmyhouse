import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ContractorsService } from '../services/contractors.service';
import { SearchDto } from '../dto/search.dto';
import { CreateContractorDto } from '../dto/create-contractor.dto';
import { UpdateContractorDto } from '../dto/update-contractor.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/rbac.guard';

@Controller('marketplace/contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Get()
  findAll(@Query() searchDto: SearchDto) {
    return this.contractorsService.findAll(searchDto);
  }

  @Get('search')
  search(@Query() searchDto: SearchDto) {
    return this.contractorsService.findAll(searchDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'subcontractor', 'admin')
  getMyProfile(@Request() req: any) {
    const userId = req.user?.sub;
    return this.contractorsService.findByUserId(userId);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'subcontractor', 'admin')
  createProfile(
    @Request() req: any,
    @Body() data: CreateContractorDto,
  ) {
    const userId = req.user?.sub;
    return this.contractorsService.createContractorProfile(userId, data);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'subcontractor', 'admin')
  updateProfile(
    @Request() req: any,
    @Body() data: UpdateContractorDto,
  ) {
    const userId = req.user?.sub;
    return this.contractorsService.updateContractorProfile(userId, data);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.contractorsService.findByUserId(userId);
  }
}



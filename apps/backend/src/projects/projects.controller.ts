import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  create(@Request() req: any, @Body() createProjectDto: CreateProjectDto) {
    const userId = req.user.sub;
    return this.projectsService.createProject(userId, createProjectDto);
  }

  @Post('from-design')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  createFromDesign(
    @Request() req: any,
    @Body() body: {
      designId: string;
      address: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const userId = req.user.sub;
    return this.projectsService.createProjectFromDesign(
      userId,
      body.designId,
      body.address,
      body.street,
      body.city,
      body.state,
      body.zipCode,
      body.country,
      body.latitude,
      body.longitude,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: any) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    // Admin can see all projects, others see only their own
    if (userRole === 'admin') {
      return this.projectsService.getAllProjects();
    }
    return this.projectsService.getUserProjects(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    const project = await this.projectsService.getProject(id);

    // Check authorization: user must be homeowner, contractor, or admin
    if (
      userRole !== 'admin' &&
      project.homeownerId !== userId &&
      project.generalContractorId !== userId
    ) {
      throw new ForbiddenException('You do not have permission to view this project');
    }

    return project;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'admin')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const userId = req.user.sub;
    return this.projectsService.updateProject(id, userId, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.projectsService.deleteProject(id, userId);
  }
}




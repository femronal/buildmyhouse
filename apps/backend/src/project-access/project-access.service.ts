import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, ProjectAccessRole, ProjectType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt } from 'crypto';
import { JwtAuthService } from '../auth/jwt-auth.service';
import { EmailService } from '../email/email.service';
import {
  buildAccessUrl,
  buildPostAccessRedirect,
  DEFAULT_PROJECT_TEMPLATES,
  ProjectTemplateStage,
} from './project-access.constants';
import { CreateManagedProjectDto } from './dto/project-access.dto';

@Injectable()
export class ProjectAccessService implements OnModuleInit {
  private readonly logger = new Logger(ProjectAccessService.name);
  private readonly prisma = new PrismaClient();
  private static readonly CODE_TTL_MS = 1000 * 60 * 10;

  constructor(
    private readonly jwtAuthService: JwtAuthService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultTemplates();
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private hashVerificationCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private generateRawToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private generateVerificationCode(): string {
    return String(randomInt(100000, 1000000));
  }

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  private async ensureDefaultTemplates() {
    for (const template of DEFAULT_PROJECT_TEMPLATES) {
      await this.prisma.projectTemplate.upsert({
        where: { slug: template.slug },
        create: {
          name: template.name,
          slug: template.slug,
          projectType: template.projectType,
          description: template.description,
          defaultBudget: template.defaultBudget,
          sortOrder: template.sortOrder,
          stages: template.stages,
        },
        update: {
          name: template.name,
          projectType: template.projectType,
          description: template.description,
          defaultBudget: template.defaultBudget,
          sortOrder: template.sortOrder,
          stages: template.stages,
          isActive: true,
        },
      });
    }
  }

  async listTemplates() {
    return this.prisma.projectTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getProjectAccessLinks(projectId: string) {
    const links = await this.prisma.projectAccessLink.findMany({
      where: { projectId, revokedAt: null },
      orderBy: { role: 'asc' },
      include: {
        participantUser: {
          select: { id: true, fullName: true, email: true, managedParticipant: true, accessClaimedAt: true },
        },
      },
    });

    return links.map((link) => ({
      id: link.id,
      role: link.role,
      contactEmail: link.contactEmail,
      contactName: link.contactName,
      contactPhone: link.contactPhone,
      emailVerifiedAt: link.emailVerifiedAt,
      lastAccessedAt: link.lastAccessedAt,
      claimedUserId: link.claimedUserId,
      participantUser: link.participantUser,
    }));
  }

  private async resolveTemplateStages(dto: CreateManagedProjectDto): Promise<{
    projectType: ProjectType;
    stages: ProjectTemplateStage[];
  }> {
    if (dto.templateId) {
      const template = await this.prisma.projectTemplate.findUnique({
        where: { id: dto.templateId },
      });
      if (!template || !template.isActive) {
        throw new NotFoundException('Project template not found');
      }
      return {
        projectType: template.projectType,
        stages: (template.stages as ProjectTemplateStage[]) || [],
      };
    }

    if (dto.stages?.length) {
      return {
        projectType: dto.projectType || 'renovation',
        stages: dto.stages,
      };
    }

    throw new BadRequestException('Select a project template or provide custom stages.');
  }

  private async createPlaceholderUser(params: {
    email: string;
    fullName: string;
    phone?: string;
    role: 'homeowner' | 'general_contractor';
  }) {
    const email = this.normalizeEmail(params.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== params.role) {
        throw new BadRequestException(
          `Email ${email} is already registered as ${existing.role}. Use a different email or assign an existing ${params.role}.`,
        );
      }
      if (!existing.managedParticipant && existing.accessClaimedAt) {
        return existing;
      }
      if (!existing.managedParticipant && !existing.accessClaimedAt) {
        throw new BadRequestException(
          `Email ${email} already has a full BuildMyHouse account. Assign this user instead of creating a managed placeholder.`,
        );
      }
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: params.fullName,
          phone: params.phone || existing.phone,
          profileSetupCompleted: true,
          managedParticipant: true,
        },
      });
    }

    const password = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password,
        fullName: params.fullName,
        phone: params.phone,
        role: params.role,
        verified: true,
        profileSetupCompleted: true,
        managedParticipant: true,
      },
    });

    if (params.role === 'general_contractor') {
      await this.prisma.contractor.create({
        data: {
          userId: user.id,
          name: params.fullName,
          specialty: 'General Contractor',
          specialtyCategory: 'general_contractor',
          specialtyTags: ['General Contractor'],
          rating: 5,
          projects: 1,
          type: 'general_contractor',
          hiringFee: 0,
          verified: true,
        },
      });
    }

    return user;
  }

  private async createAccessLink(params: {
    projectId: string;
    role: ProjectAccessRole;
    contactEmail: string;
    contactName?: string;
    contactPhone?: string;
    participantUserId: string;
  }) {
    const rawToken = this.generateRawToken();
    const link = await this.prisma.projectAccessLink.create({
      data: {
        projectId: params.projectId,
        role: params.role,
        contactEmail: this.normalizeEmail(params.contactEmail),
        contactName: params.contactName,
        contactPhone: params.contactPhone,
        participantUserId: params.participantUserId,
        tokenHash: this.hashToken(rawToken),
      },
    });

    return {
      link,
      rawToken,
      url: buildAccessUrl(params.role, rawToken),
    };
  }

  async createManagedProject(dto: CreateManagedProjectDto) {
    const { projectType, stages } = await this.resolveTemplateStages(dto);
    if (!stages.length) {
      throw new BadRequestException('Project template must include at least one stage.');
    }

    const homeowner = await this.createPlaceholderUser({
      email: dto.homeownerEmail,
      fullName: dto.homeownerName,
      phone: dto.homeownerPhone,
      role: 'homeowner',
    });

    let gcUserId: string;
    if (dto.existingGcUserId) {
      const existingGc = await this.prisma.user.findUnique({
        where: { id: dto.existingGcUserId },
      });
      if (!existingGc || existingGc.role !== 'general_contractor') {
        throw new BadRequestException('Existing GC user not found.');
      }
      gcUserId = existingGc.id;
    } else {
      const gc = await this.createPlaceholderUser({
        email: dto.gcEmail,
        fullName: dto.gcName,
        phone: dto.gcPhone,
        role: 'general_contractor',
      });
      gcUserId = gc.id;
    }

    const budgetTotal =
      dto.budget > 0 ? dto.budget : stages.reduce((sum, stage) => sum + Number(stage.estimatedCost || 0), 0);

    const project = await this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        address: dto.address.trim(),
        street: dto.street?.trim(),
        city: dto.city?.trim(),
        state: dto.state?.trim(),
        country: dto.country?.trim() || 'Nigeria',
        budget: budgetTotal,
        homeownerId: homeowner.id,
        generalContractorId: gcUserId,
        projectType,
        status: 'active',
        managedByAdmin: true,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        currentStage: stages[0]?.name || null,
        stages: {
          create: stages.map((stage, index) => ({
            name: stage.name,
            order: index + 1,
            estimatedCost: Number(stage.estimatedCost || 0),
            estimatedDuration: stage.estimatedDuration || '1 week',
            status: index === 0 ? 'in_progress' : 'not_started',
            startDate: index === 0 ? new Date() : null,
          })),
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
        homeowner: { select: { id: true, fullName: true, email: true } },
        generalContractor: { select: { id: true, fullName: true, email: true } },
      },
    });

    const homeownerLink = await this.createAccessLink({
      projectId: project.id,
      role: 'homeowner',
      contactEmail: dto.homeownerEmail,
      contactName: dto.homeownerName,
      contactPhone: dto.homeownerPhone,
      participantUserId: homeowner.id,
    });

    const gcParticipantId = dto.existingGcUserId || gcUserId;
    const gcLink = await this.createAccessLink({
      projectId: project.id,
      role: 'general_contractor',
      contactEmail: dto.gcEmail,
      contactName: dto.gcName,
      contactPhone: dto.gcPhone,
      participantUserId: gcParticipantId,
    });

    await this.sendProjectInviteEmail({
      to: dto.homeownerEmail,
      recipientName: dto.homeownerName,
      roleLabel: 'homeowner',
      projectName: project.name,
      accessUrl: homeownerLink.url,
    });

    await this.sendProjectInviteEmail({
      to: dto.gcEmail,
      recipientName: dto.gcName,
      roleLabel: 'general contractor',
      projectName: project.name,
      accessUrl: gcLink.url,
    });

    return {
      project,
      links: {
        homeowner: {
          id: homeownerLink.link.id,
          url: homeownerLink.url,
          email: dto.homeownerEmail,
        },
        generalContractor: {
          id: gcLink.link.id,
          url: gcLink.url,
          email: dto.gcEmail,
        },
      },
    };
  }

  async getAccessPreview(rawToken: string) {
    const link = await this.findActiveLink(rawToken);
    const project = await this.prisma.project.findUnique({
      where: { id: link.projectId },
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        projectType: true,
        budget: true,
        progress: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    return {
      role: link.role,
      contactEmail: link.contactEmail,
      contactName: link.contactName,
      project,
      requiresVerification: !link.emailVerifiedAt,
    };
  }

  private async findActiveLink(rawToken: string) {
    const tokenHash = this.hashToken(String(rawToken || '').trim());
    const link = await this.prisma.projectAccessLink.findUnique({
      where: { tokenHash },
      include: {
        participantUser: true,
        project: true,
      },
    });
    if (!link || link.revokedAt) {
      throw new NotFoundException('This project access link is invalid or has expired.');
    }
    return link;
  }

  async requestAccessCode(rawToken: string, email: string) {
    const link = await this.findActiveLink(rawToken);
    const normalizedEmail = this.normalizeEmail(email);
    if (normalizedEmail !== link.contactEmail) {
      throw new ForbiddenException('Use the email address BuildMyHouse has on file for this project link.');
    }

    const code = this.generateVerificationCode();
    await this.prisma.projectAccessLink.update({
      where: { id: link.id },
      data: {
        verificationCodeHash: this.hashVerificationCode(code),
        verificationExpiresAt: new Date(Date.now() + ProjectAccessService.CODE_TTL_MS),
      },
    });

    await this.emailService.send({
      to: normalizedEmail,
      subject: `${code} — your BuildMyHouse project access code`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <p>Hello${link.contactName ? ` ${link.contactName}` : ''},</p>
          <p>Use this code to open your BuildMyHouse project <strong>${link.project.name}</strong>:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
          <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
          <p>— BuildMyHouse</p>
        </div>
      `,
      text: `Your BuildMyHouse access code is ${code}. It expires in 10 minutes.`,
    });

    return { message: 'Verification code sent.' };
  }

  async verifyAccessCode(rawToken: string, email: string, code: string, acceptTerms?: boolean) {
    const link = await this.findActiveLink(rawToken);
    const normalizedEmail = this.normalizeEmail(email);
    if (normalizedEmail !== link.contactEmail) {
      throw new ForbiddenException('Use the email address BuildMyHouse has on file for this project link.');
    }
    if (!acceptTerms) {
      throw new BadRequestException('Please accept the BuildMyHouse tracking terms to continue.');
    }

    if (
      !link.verificationCodeHash ||
      !link.verificationExpiresAt ||
      link.verificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Verification code expired. Request a new code.');
    }

    if (link.verificationCodeHash !== this.hashVerificationCode(String(code || '').trim())) {
      throw new BadRequestException('Invalid verification code.');
    }

    const now = new Date();
    const participant = link.participantUser;
    const termsField =
      link.role === 'homeowner' ? { homeownerTermsAcceptedAt: now } : { gcTermsAcceptedAt: now };

    await this.prisma.projectAccessLink.update({
      where: { id: link.id },
      data: {
        emailVerifiedAt: now,
        termsAcceptedAt: now,
        lastAccessedAt: now,
        verificationCodeHash: null,
        verificationExpiresAt: null,
      },
    });

    await this.prisma.user.update({
      where: { id: participant.id },
      data: {
        profileSetupCompleted: true,
        managedParticipant: true,
        ...termsField,
      },
    });

    const token = await this.jwtAuthService.generateToken(
      participant.id,
      participant.email,
      participant.role,
    );

    return {
      token,
      user: {
        id: participant.id,
        email: participant.email,
        fullName: participant.fullName,
        role: participant.role,
        verified: participant.verified,
        managedParticipant: true,
        profileSetupCompleted: true,
      },
      projectId: link.projectId,
      redirectPath: buildPostAccessRedirect(link.role, link.projectId),
    };
  }

  async resendProjectLink(linkId: string) {
    const existing = await this.prisma.projectAccessLink.findUnique({
      where: { id: linkId },
      include: { project: true },
    });
    if (!existing || existing.revokedAt) {
      throw new NotFoundException('Access link not found');
    }

    const rawToken = this.generateRawToken();
    const updated = await this.prisma.projectAccessLink.update({
      where: { id: linkId },
      data: {
        tokenHash: this.hashToken(rawToken),
        verificationCodeHash: null,
        verificationExpiresAt: null,
      },
    });

    const url = buildAccessUrl(updated.role, rawToken);
    await this.sendProjectInviteEmail({
      to: updated.contactEmail,
      recipientName: updated.contactName || updated.contactEmail,
      roleLabel: updated.role === 'homeowner' ? 'homeowner' : 'general contractor',
      projectName: existing.project.name,
      accessUrl: url,
    });

    return { id: updated.id, url, email: updated.contactEmail, role: updated.role };
  }

  async claimManagedAccount(params: {
    accessToken: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) {
    const link = await this.findActiveLink(params.accessToken);
    const normalizedEmail = this.normalizeEmail(params.email);
    if (normalizedEmail !== link.contactEmail) {
      throw new ForbiddenException('Email must match the address on your project link.');
    }

    const hashedPassword = await bcrypt.hash(params.password, 10);
    const now = new Date();
    const user = await this.prisma.user.update({
      where: { id: link.participantUserId },
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName: params.fullName.trim() || link.contactName || normalizedEmail,
        phone: params.phone || link.contactPhone,
        managedParticipant: false,
        accessClaimedAt: now,
        profileSetupCompleted: true,
      },
    });

    await this.prisma.projectAccessLink.update({
      where: { id: link.id },
      data: { claimedUserId: user.id },
    });

    const token = await this.jwtAuthService.generateToken(user.id, user.email, user.role);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        verified: user.verified,
        managedParticipant: false,
        profileSetupCompleted: true,
      },
      projectId: link.projectId,
      redirectPath: buildPostAccessRedirect(link.role, link.projectId),
    };
  }

  async notifyManagedProjectUpdate(params: {
    projectId: string;
    title: string;
    message: string;
  }) {
    const links = await this.prisma.projectAccessLink.findMany({
      where: { projectId: params.projectId, revokedAt: null },
      include: { project: { select: { name: true } } },
    });

    for (const link of links) {
      try {
        await this.emailService.send({
          to: link.contactEmail,
          subject: `${params.title} — ${link.project.name}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
              <p>Hello${link.contactName ? ` ${link.contactName}` : ''},</p>
              <p>${params.message}</p>
              <p>Use the project tracking link BuildMyHouse emailed to you to open the latest update.</p>
              <p>— BuildMyHouse</p>
            </div>
          `,
          text: `${params.title}\n\n${params.message}`,
        });
      } catch (error) {
        this.logger.warn(`Failed to email ${link.contactEmail}: ${String(error)}`);
      }
    }
  }

  private async sendProjectInviteEmail(params: {
    to: string;
    recipientName: string;
    roleLabel: string;
    projectName: string;
    accessUrl: string;
  }) {
    await this.emailService.send({
      to: this.normalizeEmail(params.to),
      subject: `Your BuildMyHouse project link — ${params.projectName}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <p>Hello ${params.recipientName},</p>
          <p>BuildMyHouse has opened a managed project for you as the <strong>${params.roleLabel}</strong>.</p>
          <p><strong>${params.projectName}</strong></p>
          <p><a href="${params.accessUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:600;">Open project tracking</a></p>
          <p>No full signup is required to start. We will verify your email when you open the link.</p>
          <p>— BuildMyHouse</p>
        </div>
      `,
      text: `Open your BuildMyHouse project: ${params.accessUrl}`,
    });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  HR_PERMISSION_CATALOG,
  SUPER_ADMIN_ROLE_KEY,
} from '../hr/permissions/permission-catalog';
import type { FullAdminAccessAccount } from '../admin/admin.service';
import { AdminAccessPermissionsService } from './admin-access-permissions.service';
import { AdminAccessAuditService } from './admin-access-audit.service';
import { AdminAccessGateService } from './admin-access-gate.service';
import {
  AssignRoleDto,
  CreateAccessRequestDto,
  DecideAccessRequestDto,
  ExtendAccessDto,
  GrantAccessDto,
  LinkStaffProfileDto,
  OverridePermissionDto,
  RemoveOverrideDto,
  RestoreAccessDto,
  RevokeAccessDto,
  SuspendAccessDto,
  UpdateAccessDto,
  UpsertRoleDto,
} from './dto/admin-access.dto';

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class AdminAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly permissions: AdminAccessPermissionsService,
    private readonly audit: AdminAccessAuditService,
    private readonly gate: AdminAccessGateService,
  ) {}

  async ensureMigratedProfiles() {
    const admins = await this.prisma.user.findMany({
      where: {
        role: 'admin',
        adminAccessProfile: null,
      },
      select: {
        id: true,
        adminDashboardAccess: true,
        staffProfile: {
          select: {
            id: true,
            roleAssignments: {
              where: { revokedAt: null },
              select: { roleId: true },
            },
          },
        },
      },
    });

    if (admins.length === 0) return { migrated: 0 };

    const superRole = await this.prisma.adminRole.findUnique({
      where: { key: SUPER_ADMIN_ROLE_KEY },
      select: { id: true },
    });
    if (!superRole) {
      throw new BadRequestException(
        'Super Admin role is missing. Run the People & HR / admin-access seed first.',
      );
    }

    let migrated = 0;
    for (const admin of admins) {
      const profile = await this.prisma.adminAccessProfile.create({
        data: {
          userId: admin.id,
          staffProfileId: admin.staffProfile?.id ?? null,
          accessRelationship: admin.staffProfile ? 'employee' : 'external',
          status: admin.adminDashboardAccess ? 'active' : 'revoked',
          accessStartsAt: admin.adminDashboardAccess ? new Date() : null,
          revokedAt: admin.adminDashboardAccess ? null : new Date(),
          revokeReason: admin.adminDashboardAccess
            ? null
            : 'Migrated without dashboard access',
        },
      });

      // Preserve limited staff roles; only treat unrestricted admins as Super Admin.
      const existingRoleIds = admin.staffProfile?.roleAssignments.map((a) => a.roleId) ?? [];
      const roleIdsToAssign =
        existingRoleIds.length > 0 ? Array.from(new Set(existingRoleIds)) : [superRole.id];

      await this.prisma.adminUserRoleAssignment.createMany({
        data: roleIdsToAssign.map((roleId) => ({
          accessProfileId: profile.id,
          roleId,
        })),
        skipDuplicates: true,
      });
      migrated += 1;
    }

    return { migrated };
  }

  async listAccounts(filters?: {
    status?: string;
    roleKey?: string;
    q?: string;
    relationship?: string;
  }) {
    await this.ensureMigratedProfiles();

    const q = String(filters?.q || '').trim().toLowerCase();
    const profileFilter: Record<string, unknown> = {};
    if (filters?.status) profileFilter.status = filters.status;
    if (filters?.relationship) profileFilter.accessRelationship = filters.relationship;
    if (filters?.roleKey) {
      profileFilter.roleAssignments = {
        some: {
          revokedAt: null,
          role: { key: filters.roleKey },
        },
      };
    }

    const users = await this.prisma.user.findMany({
      where: {
        role: 'admin',
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { fullName: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(Object.keys(profileFilter).length > 0
          ? { adminAccessProfile: profileFilter }
          : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        verified: true,
        adminDashboardAccess: true,
        adminAccessVersion: true,
        forcePasswordReset: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        staffProfile: {
          select: {
            id: true,
            fullName: true,
            employmentStatus: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
          },
        },
        adminAccessProfile: {
          select: {
            id: true,
            status: true,
            accessRelationship: true,
            organisation: true,
            accessReason: true,
            accessStartsAt: true,
            accessExpiresAt: true,
            suspendedAt: true,
            suspendedUntil: true,
            revokedAt: true,
            roleAssignments: {
              where: { revokedAt: null },
              select: {
                role: { select: { id: true, key: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const enriched = await Promise.all(
      users.map(async (user) => {
        const effective = await this.permissions.getEffectivePermissions(user.id);
        const roleKeys = user.adminAccessProfile?.roleAssignments.map((a) => a.role.key) ?? [];
        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          verified: user.verified,
          adminDashboardAccess: user.adminDashboardAccess,
          adminAccessVersion: user.adminAccessVersion,
          forcePasswordReset: user.forcePasswordReset,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          staffProfile: user.staffProfile,
          accessProfile: user.adminAccessProfile,
          roleKeys,
          isSuperAdmin: effective.isSuperAdmin,
          accessAllowed: effective.accessAllowed,
          permissionCount: effective.isSuperAdmin
            ? null
            : effective.permissions.length,
        };
      }),
    );

    return enriched;
  }

  async getStats() {
    await this.ensureMigratedProfiles();

    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const profiles = await this.prisma.adminAccessProfile.findMany({
      select: {
        status: true,
        accessExpiresAt: true,
        roleAssignments: {
          where: { revokedAt: null },
          select: { role: { select: { key: true } } },
        },
      },
    });

    const total = profiles.length;
    let active = 0;
    let suspended = 0;
    let revoked = 0;
    let superAdmins = 0;
    let limited = 0;
    let expiringSoon = 0;

    for (const profile of profiles) {
      if (profile.status === 'active') active += 1;
      if (profile.status === 'suspended') suspended += 1;
      if (profile.status === 'revoked') revoked += 1;

      const isSuper = profile.roleAssignments.some(
        (a) => a.role.key === SUPER_ADMIN_ROLE_KEY,
      );
      if (isSuper && profile.status === 'active') superAdmins += 1;
      if (!isSuper && profile.status === 'active') limited += 1;

      if (
        profile.status === 'active' &&
        profile.accessExpiresAt &&
        profile.accessExpiresAt > now &&
        profile.accessExpiresAt <= inSevenDays
      ) {
        expiringSoon += 1;
      }
    }

    return {
      total,
      active,
      limited,
      superAdmins,
      suspended,
      revoked,
      expiringSoon,
    };
  }

  async getAccount(userId: string) {
    await this.ensureMigratedProfiles();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        verified: true,
        role: true,
        adminDashboardAccess: true,
        adminAccessVersion: true,
        forcePasswordReset: true,
        lastLoginAt: true,
        lastPasswordChangeAt: true,
        failedLoginCount: true,
        lastFailedLoginAt: true,
        createdAt: true,
        updatedAt: true,
        staffProfile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employmentStatus: true,
            workforceType: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
          },
        },
        adminAccessProfile: {
          include: {
            sponsor: { select: { id: true, fullName: true, email: true } },
            createdBy: { select: { id: true, fullName: true, email: true } },
            roleAssignments: {
              where: { revokedAt: null },
              include: {
                role: {
                  select: {
                    id: true,
                    key: true,
                    name: true,
                    description: true,
                  },
                },
                grantedBy: { select: { id: true, fullName: true, email: true } },
              },
            },
            overrides: {
              where: { revokedAt: null },
              include: {
                permission: {
                  select: { id: true, key: true, groupLabel: true, description: true },
                },
                grantedBy: { select: { id: true, fullName: true, email: true } },
              },
            },
            invitations: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true,
                email: true,
                expiresAt: true,
                acceptedAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.role !== 'admin') {
      throw new NotFoundException('Admin account not found');
    }

    const effective = await this.permissions.getEffectivePermissions(userId);
    const recentAudit = await this.audit.list({ targetUserId: userId, take: 25 });

    return {
      identity: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        verified: user.verified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      staffProfile: user.staffProfile,
      accessProfile: user.adminAccessProfile,
      roles: user.adminAccessProfile?.roleAssignments ?? [],
      overrides: user.adminAccessProfile?.overrides ?? [],
      invitations: user.adminAccessProfile?.invitations ?? [],
      effectivePermissions: effective,
      security: {
        adminDashboardAccess: user.adminDashboardAccess,
        adminAccessVersion: user.adminAccessVersion,
        forcePasswordReset: user.forcePasswordReset,
        lastLoginAt: user.lastLoginAt,
        lastPasswordChangeAt: user.lastPasswordChangeAt,
        failedLoginCount: user.failedLoginCount,
        lastFailedLoginAt: user.lastFailedLoginAt,
      },
      recentAudit,
    };
  }

  async grantAccess(actorUserId: string, dto: GrantAccessDto) {
    const role = await this.prisma.adminRole.findUnique({
      where: { key: dto.roleKey },
      select: { id: true, key: true, name: true, archivedAt: true },
    });
    if (!role || role.archivedAt) {
      throw new BadRequestException(`Role "${dto.roleKey}" not found`);
    }

    let email = String(dto.email || '').trim().toLowerCase();
    let fullName = String(dto.fullName || '').trim();
    let staffProfileId: string | null = dto.staffProfileId ?? null;

    if (dto.mode === 'staff') {
      if (!staffProfileId) {
        throw new BadRequestException('staffProfileId is required for staff mode');
      }
      const staff = await this.prisma.staffProfile.findUnique({
        where: { id: staffProfileId },
        select: {
          id: true,
          email: true,
          fullName: true,
          userId: true,
          employmentStatus: true,
        },
      });
      if (!staff) throw new NotFoundException('Staff profile not found');
      if (staff.employmentStatus === 'exited') {
        throw new BadRequestException('Cannot grant access to exited staff');
      }
      email = String(staff.email || email).trim().toLowerCase();
      fullName = String(staff.fullName || fullName).trim();
      if (!email) throw new BadRequestException('Staff profile has no email');
    } else {
      if (!email) throw new BadRequestException('email is required for external mode');
      if (!fullName) throw new BadRequestException('fullName is required for external mode');
    }

    const accessExpiresAt = this.resolveExpiry(dto);
    if (dto.mode === 'external' && !accessExpiresAt && dto.roleKey !== SUPER_ADMIN_ROLE_KEY) {
      // Prefer expiry for external — warn via soft default of 90 days if temporaryDays omitted
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        fullName: true,
        adminAccessProfile: { select: { id: true, status: true } },
      },
    });

    if (existing && existing.role !== 'admin') {
      throw new BadRequestException(
        'A non-admin account already uses this email. Convert via staff login tooling first.',
      );
    }

    const sendInvite = dto.sendInvite !== false && !dto.temporaryPassword;
    const initialStatus = sendInvite ? 'invited' : 'active';
    const hashedPassword = dto.temporaryPassword
      ? await bcrypt.hash(dto.temporaryPassword, 10)
      : undefined;

    let userId: string;

    if (existing) {
      userId = existing.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: 'admin',
          fullName: fullName || existing.fullName,
          verified: true,
          adminDashboardAccess: initialStatus === 'active',
          ...(hashedPassword
            ? { password: hashedPassword, forcePasswordReset: true }
            : {}),
        },
      });

      if (existing.adminAccessProfile) {
        await this.prisma.adminAccessProfile.update({
          where: { id: existing.adminAccessProfile.id },
          data: {
            staffProfileId,
            accessRelationship: dto.accessRelationship,
            organisation: dto.organisation ?? null,
            accessReason: dto.accessReason ?? null,
            sponsorUserId: dto.sponsorUserId ?? null,
            accessStartsAt: dto.accessStartsAt
              ? new Date(dto.accessStartsAt)
              : new Date(),
            accessExpiresAt,
            status: initialStatus,
            suspendedAt: null,
            suspendedUntil: null,
            suspendReason: null,
            revokedAt: null,
            revokeReason: null,
            createdByUserId: actorUserId,
          },
        });
      } else {
        await this.prisma.adminAccessProfile.create({
          data: {
            userId,
            staffProfileId,
            accessRelationship: dto.accessRelationship,
            organisation: dto.organisation ?? null,
            accessReason: dto.accessReason ?? null,
            sponsorUserId: dto.sponsorUserId ?? null,
            accessStartsAt: dto.accessStartsAt
              ? new Date(dto.accessStartsAt)
              : new Date(),
            accessExpiresAt,
            status: initialStatus,
            createdByUserId: actorUserId,
          },
        });
      }
    } else {
      // Invite-only users need a password placeholder until accept
      const placeholderPassword =
        hashedPassword || (await bcrypt.hash(randomBytes(24).toString('hex'), 10));

      const created = await this.prisma.user.create({
        data: {
          email,
          fullName,
          password: placeholderPassword,
          role: 'admin',
          verified: true,
          adminDashboardAccess: initialStatus === 'active',
          forcePasswordReset: !!dto.temporaryPassword,
          adminAccessProfile: {
            create: {
              staffProfileId,
              accessRelationship: dto.accessRelationship,
              organisation: dto.organisation ?? null,
              accessReason: dto.accessReason ?? null,
              sponsorUserId: dto.sponsorUserId ?? null,
              accessStartsAt: dto.accessStartsAt
                ? new Date(dto.accessStartsAt)
                : new Date(),
              accessExpiresAt,
              status: initialStatus,
              createdByUserId: actorUserId,
            },
          },
        },
        select: { id: true },
      });
      userId = created.id;
    }

    if (staffProfileId) {
      await this.prisma.staffProfile
        .update({
          where: { id: staffProfileId },
          data: { userId },
        })
        .catch(() => undefined);
    }

    const profile = await this.prisma.adminAccessProfile.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });

    await this.prisma.adminUserRoleAssignment.updateMany({
      where: { accessProfileId: profile.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.adminUserRoleAssignment.upsert({
      where: {
        accessProfileId_roleId: {
          accessProfileId: profile.id,
          roleId: role.id,
        },
      },
      create: {
        accessProfileId: profile.id,
        roleId: role.id,
        grantedByUserId: actorUserId,
      },
      update: {
        revokedAt: null,
        grantedByUserId: actorUserId,
      },
    });

    let inviteSent = false;
    if (sendInvite) {
      inviteSent = await this.createAndSendInvitation({
        accessProfileId: profile.id,
        email,
        actorUserId,
        fullName,
      });
    }

    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.grant',
      summary: `Granted ${role.key} access to ${email}`,
      newValue: {
        roleKey: role.key,
        status: initialStatus,
        accessRelationship: dto.accessRelationship,
        accessExpiresAt,
        inviteSent,
      },
      reason: dto.accessReason,
    });

    return this.getAccount(userId);
  }

  async updateAccess(actorUserId: string, userId: string, dto: UpdateAccessDto) {
    const profile = await this.requireProfile(userId);
    const previous = { ...profile };

    const data: Record<string, unknown> = {};
    if (dto.accessRelationship !== undefined) data.accessRelationship = dto.accessRelationship;
    if (dto.accessReason !== undefined) data.accessReason = dto.accessReason;
    if (dto.organisation !== undefined) data.organisation = dto.organisation;
    if (dto.accessExpiresAt !== undefined) {
      data.accessExpiresAt = dto.accessExpiresAt ? new Date(dto.accessExpiresAt) : null;
    }
    if (dto.staffProfileId !== undefined) data.staffProfileId = dto.staffProfileId;
    if (dto.sponsorUserId !== undefined) data.sponsorUserId = dto.sponsorUserId;

    if (Object.keys(data).length > 0) {
      await this.prisma.adminAccessProfile.update({
        where: { id: profile.id },
        data,
      });
    }

    if (dto.roleKey) {
      await this.assignRole(actorUserId, userId, { roleKey: dto.roleKey });
    }

    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.update',
      summary: 'Updated admin access profile',
      previousValue: previous,
      newValue: dto,
    });

    return this.getAccount(userId);
  }

  async assignRole(actorUserId: string, userId: string, dto: AssignRoleDto) {
    const profile = await this.requireProfile(userId);
    const role = await this.prisma.adminRole.findUnique({
      where: { key: dto.roleKey },
      select: { id: true, key: true, archivedAt: true },
    });
    if (!role || role.archivedAt) {
      throw new BadRequestException(`Role "${dto.roleKey}" not found`);
    }

    const currentKeys = await this.getActiveRoleKeys(profile.id);
    const wasSuper = currentKeys.includes(SUPER_ADMIN_ROLE_KEY);
    const willBeSuper = role.key === SUPER_ADMIN_ROLE_KEY;

    if (wasSuper && !willBeSuper) {
      await this.assertNotLastActiveSuperAdmin(userId);
    }

    await this.prisma.adminUserRoleAssignment.updateMany({
      where: { accessProfileId: profile.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.adminUserRoleAssignment.upsert({
      where: {
        accessProfileId_roleId: {
          accessProfileId: profile.id,
          roleId: role.id,
        },
      },
      create: {
        accessProfileId: profile.id,
        roleId: role.id,
        grantedByUserId: actorUserId,
      },
      update: {
        revokedAt: null,
        grantedByUserId: actorUserId,
      },
    });

    await this.gate.bumpAccessVersion(userId);

    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.assign_role',
      summary: `Assigned role ${role.key}`,
      previousValue: { roleKeys: currentKeys },
      newValue: { roleKey: role.key },
    });

    return this.getAccount(userId);
  }

  async setOverride(actorUserId: string, userId: string, dto: OverridePermissionDto) {
    const profile = await this.requireProfile(userId);
    const permission = await this.prisma.adminPermission.findUnique({
      where: { key: dto.permissionKey },
      select: { id: true, key: true },
    });
    if (!permission) {
      throw new BadRequestException(`Permission "${dto.permissionKey}" not found`);
    }

    await this.prisma.adminPermissionOverride.upsert({
      where: {
        accessProfileId_permissionId_effect: {
          accessProfileId: profile.id,
          permissionId: permission.id,
          effect: dto.effect,
        },
      },
      create: {
        accessProfileId: profile.id,
        permissionId: permission.id,
        effect: dto.effect,
        reason: dto.reason,
        grantedByUserId: actorUserId,
      },
      update: {
        revokedAt: null,
        reason: dto.reason,
        grantedByUserId: actorUserId,
      },
    });

    await this.gate.bumpAccessVersion(userId);
    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.override.set',
      summary: `${dto.effect} override for ${dto.permissionKey}`,
      reason: dto.reason,
      newValue: dto,
    });

    return this.getAccount(userId);
  }

  async removeOverride(actorUserId: string, userId: string, dto: RemoveOverrideDto) {
    const profile = await this.requireProfile(userId);
    const permission = await this.prisma.adminPermission.findUnique({
      where: { key: dto.permissionKey },
      select: { id: true },
    });
    if (!permission) {
      throw new BadRequestException(`Permission "${dto.permissionKey}" not found`);
    }

    await this.prisma.adminPermissionOverride.updateMany({
      where: {
        accessProfileId: profile.id,
        permissionId: permission.id,
        effect: dto.effect,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await this.gate.bumpAccessVersion(userId);
    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.override.remove',
      summary: `Removed ${dto.effect} override for ${dto.permissionKey}`,
      previousValue: dto,
    });

    return this.getAccount(userId);
  }

  async suspendAccess(actorUserId: string, userId: string, dto: SuspendAccessDto) {
    if (actorUserId === userId) {
      const isSuper = await this.userHasActiveSuperRole(userId);
      if (isSuper) {
        await this.assertNotLastActiveSuperAdmin(userId);
      }
    } else {
      await this.assertNotLastActiveSuperAdmin(userId);
    }

    const profile = await this.requireProfile(userId);
    await this.prisma.adminAccessProfile.update({
      where: { id: profile.id },
      data: {
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedUntil: dto.until ? new Date(dto.until) : null,
        suspendReason: dto.reason,
      },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { adminDashboardAccess: false },
    });
    await this.gate.bumpAccessVersion(userId);

    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.suspend',
      summary: 'Suspended admin access',
      reason: dto.reason,
      newValue: { until: dto.until ?? null },
    });

    return this.getAccount(userId);
  }

  async revokeAccess(actorUserId: string, userId: string, dto: RevokeAccessDto) {
    // Blocks revoking the last active Super Admin (including self-revoke).
    await this.assertNotLastActiveSuperAdmin(userId);

    const profile = await this.requireProfile(userId);
    await this.prisma.adminAccessProfile.update({
      where: { id: profile.id },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revokeReason: dto.reason,
        suspendedAt: null,
        suspendedUntil: null,
      },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { adminDashboardAccess: false },
    });
    await this.gate.bumpAccessVersion(userId);

    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.revoke',
      summary: 'Revoked admin access',
      reason: dto.reason,
    });

    return this.getAccount(userId);
  }

  async restoreAccess(actorUserId: string, userId: string, dto: RestoreAccessDto) {
    const profile = await this.requireProfile(userId);
    await this.prisma.adminAccessProfile.update({
      where: { id: profile.id },
      data: {
        status: 'active',
        suspendedAt: null,
        suspendedUntil: null,
        suspendReason: null,
        revokedAt: null,
        revokeReason: null,
        accessStartsAt: profile.accessStartsAt ?? new Date(),
      },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { adminDashboardAccess: true },
    });

    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.restore',
      summary: 'Restored admin access',
      reason: dto.reason,
    });

    return this.getAccount(userId);
  }

  async revokeSessions(actorUserId: string, userId: string) {
    await this.requireProfile(userId);
    const bumped = await this.gate.bumpAccessVersion(userId);
    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.revoke_sessions',
      summary: 'Revoked active admin sessions',
      newValue: { adminAccessVersion: bumped.adminAccessVersion },
    });
    return { ok: true, adminAccessVersion: bumped.adminAccessVersion };
  }

  async extendAccess(actorUserId: string, userId: string, dto: ExtendAccessDto) {
    const profile = await this.requireProfile(userId);
    const expiresAt = new Date(dto.accessExpiresAt);
    await this.prisma.adminAccessProfile.update({
      where: { id: profile.id },
      data: {
        accessExpiresAt: expiresAt,
        status: profile.status === 'expired' ? 'active' : profile.status,
      },
    });
    if (profile.status === 'expired') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { adminDashboardAccess: true },
      });
    }

    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.extend',
      summary: 'Extended admin access expiry',
      previousValue: { accessExpiresAt: profile.accessExpiresAt },
      newValue: { accessExpiresAt: expiresAt },
    });

    return this.getAccount(userId);
  }

  async linkStaffProfile(actorUserId: string, userId: string, dto: LinkStaffProfileDto) {
    await this.requireProfile(userId);
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: dto.staffProfileId },
      select: { id: true, userId: true },
    });
    if (!staff) throw new NotFoundException('Staff profile not found');
    if (staff.userId && staff.userId !== userId) {
      throw new BadRequestException('Staff profile is already linked to another user');
    }

    await this.prisma.$transaction([
      this.prisma.adminAccessProfile.update({
        where: { userId },
        data: {
          staffProfileId: staff.id,
          accessRelationship: 'employee',
        },
      }),
      this.prisma.staffProfile.update({
        where: { id: staff.id },
        data: { userId },
      }),
    ]);

    await this.audit.log({
      actorUserId,
      targetUserId: userId,
      action: 'access.link_staff',
      summary: 'Linked staff profile to admin access',
      newValue: { staffProfileId: staff.id },
    });

    return this.getAccount(userId);
  }

  async listRoles() {
    return this.prisma.adminRole.findMany({
      where: { archivedAt: null },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                key: true,
                groupLabel: true,
                description: true,
                isCritical: true,
              },
            },
          },
        },
        _count: {
          select: {
            userAssignments: { where: { revokedAt: null } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async upsertRole(actorUserId: string, dto: UpsertRoleDto, roleId?: string) {
    const key =
      dto.key ||
      dto.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    if (!key) throw new BadRequestException('Role key is required');

    const permissions = await this.prisma.adminPermission.findMany({
      where: { key: { in: dto.permissionKeys } },
      select: { id: true, key: true },
    });
    if (permissions.length !== dto.permissionKeys.length) {
      const found = new Set(permissions.map((p) => p.key));
      const missing = dto.permissionKeys.filter((k) => !found.has(k));
      throw new BadRequestException(`Unknown permission keys: ${missing.join(', ')}`);
    }

    let role;
    if (roleId) {
      const existing = await this.prisma.adminRole.findUnique({ where: { id: roleId } });
      if (!existing) throw new NotFoundException('Role not found');
      if (existing.isSystem && existing.key === SUPER_ADMIN_ROLE_KEY) {
        // Allow updating permissions list for super admin (catalog keys)
      }
      role = await this.prisma.adminRole.update({
        where: { id: roleId },
        data: {
          name: dto.name,
          description: dto.description,
          ...(dto.key && !existing.isSystem ? { key: dto.key } : {}),
        },
      });
    } else {
      role = await this.prisma.adminRole.upsert({
        where: { key },
        create: {
          key,
          name: dto.name,
          description: dto.description,
          isSystem: false,
        },
        update: {
          name: dto.name,
          description: dto.description,
          archivedAt: null,
        },
      });
    }

    await this.prisma.adminRolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length > 0) {
      await this.prisma.adminRolePermission.createMany({
        data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }

    await this.audit.log({
      actorUserId,
      action: 'role.upsert',
      summary: `Upserted role ${role.key}`,
      newValue: { roleId: role.id, key: role.key, permissionKeys: dto.permissionKeys },
    });

    return this.prisma.adminRole.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async listPermissions() {
    const catalogCritical = new Map(
      HR_PERMISSION_CATALOG.map((p) => [p.key, !!p.isCritical]),
    );
    const rows = await this.prisma.adminPermission.findMany({
      orderBy: [{ groupLabel: 'asc' }, { key: 'asc' }],
    });
    return rows.map((row) => ({
      ...row,
      isCritical: row.isCritical || catalogCritical.get(row.key) === true,
    }));
  }

  async listAudit(params?: { targetUserId?: string; action?: string; take?: number }) {
    return this.audit.list(params);
  }

  async listRequests(status?: string) {
    return this.prisma.adminAccessRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        requestingUser: {
          select: { id: true, fullName: true, email: true },
        },
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
        permission: {
          select: { id: true, key: true, groupLabel: true, description: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createRequest(requestingUserId: string, dto: CreateAccessRequestDto) {
    const permission = await this.prisma.adminPermission.findUnique({
      where: { key: dto.permissionKey },
      select: { id: true, key: true },
    });

    const request = await this.prisma.adminAccessRequest.create({
      data: {
        requestingUserId,
        permissionId: permission?.id ?? null,
        permissionKey: dto.permissionKey,
        businessReason: dto.businessReason,
        requestedDuration: dto.requestedDuration,
        status: 'pending',
      },
    });

    await this.audit.log({
      actorUserId: requestingUserId,
      targetUserId: requestingUserId,
      action: 'access.request.create',
      summary: `Requested permission ${dto.permissionKey}`,
      newValue: {
        requestId: request.id,
        permissionKey: dto.permissionKey,
        businessReason: dto.businessReason,
      },
    });

    return request;
  }

  async decideRequest(
    reviewerUserId: string,
    requestId: string,
    dto: DecideAccessRequestDto,
  ) {
    const request = await this.prisma.adminAccessRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Access request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('Request has already been decided');
    }

    const updated = await this.prisma.adminAccessRequest.update({
      where: { id: requestId },
      data: {
        status: dto.decision,
        reviewerUserId,
        decisionNotes: dto.notes,
        decidedAt: new Date(),
      },
    });

    if (dto.decision === 'approved') {
      const profile = await this.prisma.adminAccessProfile.findUnique({
        where: { userId: request.requestingUserId },
        select: { id: true },
      });
      const permission = await this.prisma.adminPermission.findUnique({
        where: { key: request.permissionKey },
        select: { id: true },
      });
      if (profile && permission) {
        await this.prisma.adminPermissionOverride.upsert({
          where: {
            accessProfileId_permissionId_effect: {
              accessProfileId: profile.id,
              permissionId: permission.id,
              effect: 'grant',
            },
          },
          create: {
            accessProfileId: profile.id,
            permissionId: permission.id,
            effect: 'grant',
            reason: dto.notes || `Approved request ${request.id}`,
            grantedByUserId: reviewerUserId,
          },
          update: {
            revokedAt: null,
            reason: dto.notes || `Approved request ${request.id}`,
            grantedByUserId: reviewerUserId,
          },
        });
        await this.gate.bumpAccessVersion(request.requestingUserId);
      }
    }

    await this.audit.log({
      actorUserId: reviewerUserId,
      targetUserId: request.requestingUserId,
      action: `access.request.${dto.decision}`,
      summary: `${dto.decision} access request for ${request.permissionKey}`,
      reason: dto.notes,
      newValue: { requestId, decision: dto.decision },
    });

    return updated;
  }

  async acceptInvitation(token: string, password: string, fullName?: string) {
    const tokenHash = this.hashToken(token);
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { tokenHash },
      include: {
        accessProfile: {
          select: {
            id: true,
            userId: true,
            status: true,
            user: { select: { id: true, email: true, fullName: true } },
          },
        },
      },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
      throw new BadRequestException('Invitation is invalid or expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: invitation.accessProfile.userId },
        data: {
          password: hashedPassword,
          forcePasswordReset: false,
          adminDashboardAccess: true,
          lastPasswordChangeAt: new Date(),
          ...(fullName ? { fullName: fullName.trim() } : {}),
        },
      }),
      this.prisma.adminAccessProfile.update({
        where: { id: invitation.accessProfileId },
        data: { status: 'active' },
      }),
      this.prisma.adminInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    await this.audit.log({
      actorUserId: invitation.accessProfile.userId,
      targetUserId: invitation.accessProfile.userId,
      action: 'access.invite.accept',
      summary: 'Accepted admin invitation',
    });

    return {
      ok: true,
      email: invitation.accessProfile.user.email,
      message: 'Invitation accepted. You can now sign in.',
    };
  }

  // --- Compatibility wrappers for AdminService delegation ---

  async compatGetFullAdmins(): Promise<FullAdminAccessAccount[]> {
    await this.ensureMigratedProfiles();
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        fullName: true,
        verified: true,
        adminDashboardAccess: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return admins.map((admin) => ({
      ...admin,
      hasDashboardAllowlistAccess: !!admin.adminDashboardAccess,
    }));
  }

  async compatSetAccess(params: {
    actorUserId: string;
    targetUserId: string;
    enabled: boolean;
  }): Promise<FullAdminAccessAccount[]> {
    if (params.enabled) {
      await this.restoreAccess(params.actorUserId, params.targetUserId, {
        reason: 'Enabled via legacy full-admins API',
      });
    } else {
      await this.revokeAccess(params.actorUserId, params.targetUserId, {
        reason: 'Disabled via legacy full-admins API',
      });
    }
    return this.compatGetFullAdmins();
  }

  async compatCreateAdmin(params: {
    actorUserId: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<FullAdminAccessAccount[]> {
    await this.grantAccess(params.actorUserId, {
      mode: 'external',
      email: params.email,
      fullName: params.fullName,
      accessRelationship: 'external',
      roleKey: SUPER_ADMIN_ROLE_KEY,
      temporaryPassword: params.password,
      sendInvite: false,
      accessReason: 'Created via legacy full-admins API',
    });
    return this.compatGetFullAdmins();
  }

  // --- helpers ---

  private resolveExpiry(dto: GrantAccessDto): Date | null {
    if (dto.accessExpiresAt) return new Date(dto.accessExpiresAt);
    if (dto.temporaryDays && dto.temporaryDays > 0) {
      return new Date(Date.now() + dto.temporaryDays * 24 * 60 * 60 * 1000);
    }
    return null;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getAdminAppBaseUrl() {
    return (
      this.config.get<string>('ADMIN_DASHBOARD_URL') ||
      this.config.get<string>('ADMIN_APP_URL') ||
      'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  private async createAndSendInvitation(params: {
    accessProfileId: string;
    email: string;
    actorUserId: string;
    fullName: string;
  }) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    await this.prisma.adminInvitation.create({
      data: {
        accessProfileId: params.accessProfileId,
        email: params.email,
        tokenHash,
        expiresAt,
        createdByUserId: params.actorUserId,
      },
    });

    const inviteUrl = `${this.getAdminAppBaseUrl()}/accept-invite?token=${rawToken}`;
    const name = params.fullName || params.email;

    return this.email.send({
      to: params.email,
      subject: 'You are invited to the BuildMyHouse admin dashboard',
      html: `
        <p>Hi ${this.escapeHtml(name)},</p>
        <p>You have been invited to access the BuildMyHouse admin dashboard.</p>
        <p><a href="${inviteUrl}">Accept your invitation</a></p>
        <p>This link expires on ${expiresAt.toUTCString()}.</p>
        <p>If you did not expect this email, you can ignore it.</p>
      `.trim(),
      text: `Hi ${name},\n\nAccept your BuildMyHouse admin invitation: ${inviteUrl}\n\nThis link expires on ${expiresAt.toUTCString()}.`,
    });
  }

  private escapeHtml(value: string) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async requireProfile(userId: string) {
    await this.ensureMigratedProfiles();
    const profile = await this.prisma.adminAccessProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Admin access profile not found');
    }
    return profile;
  }

  private async getActiveRoleKeys(accessProfileId: string) {
    const rows = await this.prisma.adminUserRoleAssignment.findMany({
      where: { accessProfileId, revokedAt: null },
      select: { role: { select: { key: true } } },
    });
    return rows.map((r) => r.role.key);
  }

  private async userHasActiveSuperRole(userId: string) {
    const profile = await this.prisma.adminAccessProfile.findUnique({
      where: { userId },
      select: {
        status: true,
        roleAssignments: {
          where: { revokedAt: null, role: { key: SUPER_ADMIN_ROLE_KEY } },
          select: { id: true },
        },
      },
    });
    return (
      !!profile &&
      profile.status === 'active' &&
      profile.roleAssignments.length > 0
    );
  }

  private async countActiveSuperAdmins(excludeUserId?: string) {
    return this.prisma.adminAccessProfile.count({
      where: {
        status: 'active',
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
        user: { adminDashboardAccess: true },
        roleAssignments: {
          some: {
            revokedAt: null,
            role: { key: SUPER_ADMIN_ROLE_KEY },
          },
        },
      },
    });
  }

  private async assertNotLastActiveSuperAdmin(userId: string) {
    const isSuper = await this.userHasActiveSuperRole(userId);
    if (!isSuper) return;
    const others = await this.countActiveSuperAdmins(userId);
    if (others === 0) {
      throw new BadRequestException(
        'At least one active Super Admin must remain. Assign another Super Admin first.',
      );
    }
  }
}

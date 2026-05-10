import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthService, JWTPayload } from './jwt-auth.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { WebSocketService } from '../websocket/websocket.service';
import { EmailService } from '../email/email.service';
import { HOMEOWNER_WELCOME_EMAIL_TEMPLATE } from '../email/templates/homeowner-welcome.template';
import { GC_WELCOME_EMAIL_TEMPLATE } from '../email/templates/gc-welcome.template';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  private static readonly PASSWORD_RESET_TTL_MS = 1000 * 60 * 30;
  private static readonly PASSWORD_RESET_RESPONSE = {
    message: 'If an account exists for that email, a password reset link has been sent.',
  };
  private static readonly PUBLIC_SIGNUP_ROLES = new Set([
    'homeowner',
    'general_contractor',
    'subcontractor',
    'vendor',
  ]);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly jwtAuthService: JwtAuthService,
    private readonly wsService: WebSocketService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, role, phone } = registerDto;
    const normalizedRole = String(role || '').trim().toLowerCase();

    if (normalizedRole === 'admin') {
      throw new ForbiddenException(
        'Admin accounts cannot be created through public registration.',
      );
    }

    if (!AuthService.PUBLIC_SIGNUP_ROLES.has(normalizedRole)) {
      throw new BadRequestException('Invalid role selected for registration.');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with hashed password
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: normalizedRole,
        phone,
        verified: false,
      },
    });

    // Create Contractor profile for GCs so they appear in admin Contractors and Verification pages
    if (normalizedRole === 'general_contractor') {
      await this.prisma.contractor.create({
        data: {
          userId: user.id,
          name: fullName || 'General Contractor',
          specialty: 'General Contractor',
          specialtyCategory: 'general_contractor',
          specialtyTags: ['General Contractor'],
          rating: 5.0,
          projects: 10,
          type: 'general_contractor',
          hiringFee: 0,
        },
      });
    }

    await this.notifyAdminNewSignup(user.fullName ?? 'Unknown', user.email, user.role);
    await this.sendHomeownerWelcomeEmail(user.email, user.fullName, normalizedRole);
    await this.sendGeneralContractorWelcomeEmail(user.email, normalizedRole);

    // Generate JWT token
    const token = await this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        pictureUrl: user.pictureUrl,
        role: user.role,
        verified: user.verified,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateEmailPassword(loginDto);

    return this.buildAuthResponse(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = String(dto.email || '').trim().toLowerCase();
    if (!email) {
      return AuthService.PASSWORD_RESET_RESPONSE;
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    const requestedRole = dto.appRole;
    const canResetForApp =
      user &&
      (user.role === 'homeowner' || user.role === 'general_contractor') &&
      (!requestedRole || user.role === requestedRole);

    if (!canResetForApp) {
      return AuthService.PASSWORD_RESET_RESPONSE;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + AuthService.PASSWORD_RESET_TTL_MS);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    await this.sendPasswordResetEmail({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token: rawToken,
      expiresAt,
    });

    return AuthService.PASSWORD_RESET_RESPONSE;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = String(dto.token || '').trim();
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    const tokenHash = this.hashPasswordResetToken(token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      throw new BadRequestException('This password reset link is invalid or has expired.');
    }

    const sameAsCurrent = await bcrypt.compare(dto.newPassword, resetToken.user.password);
    if (sameAsCurrent) {
      throw new BadRequestException('New password must be different from your current password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully. You can now sign in with your new password.' };
  }

  async loginAdmin(loginDto: LoginDto) {
    const user = await this.validateEmailPassword(loginDto);

    if (user.role !== 'admin') {
      throw new UnauthorizedException('Only approved admin accounts can sign in here.');
    }

    const hasDashboardAccess = await this.hasAdminDashboardAccess(user.email);
    if (!hasDashboardAccess) {
      throw new UnauthorizedException('Your admin dashboard access is currently restricted.');
    }

    return this.buildAuthResponse(user);
  }

  private async validateEmailPassword(loginDto: LoginDto) {
    const email = String(loginDto.email || '').trim().toLowerCase();
    const password = String(loginDto.password || '');

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('User account not properly configured');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    fullName: string | null;
    pictureUrl: string | null;
    role: string;
    verified: boolean;
  }) {
    // Generate JWT token
    const token = await this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        pictureUrl: user.pictureUrl,
        role: user.role,
        verified: user.verified,
      },
    };
  }

  private getAdminDashboardAllowedEmails() {
    const raw =
      this.configService.get<string>('ADMIN_DASHBOARD_ALLOWED_EMAILS') ||
      this.configService.get<string>('ADMIN_ALLOWED_EMAILS') ||
      '';

    const emails = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    return new Set(emails);
  }

  private async hasAdminDashboardAccess(email: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return false;
    }

    const enabledAdmins = await this.prisma.user.findMany({
      where: {
        role: 'admin',
        adminDashboardAccess: true,
      },
      select: { email: true },
      take: 200,
    });

    if (enabledAdmins.length > 0) {
      return enabledAdmins.some(
        (admin) => String(admin.email || '').trim().toLowerCase() === normalizedEmail,
      );
    }

    const envAllowlist = this.getAdminDashboardAllowedEmails();
    if (envAllowlist.size > 0) {
      return envAllowlist.has(normalizedEmail);
    }

    // Safety fallback when no explicit allowlist is configured yet.
    return true;
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        pictureUrl: true,
        role: true,
        verified: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateCurrentUser(userId: string, updateMeDto: UpdateMeDto) {
    const data: any = {};
    if (typeof updateMeDto.fullName === 'string') {
      data.fullName = updateMeDto.fullName.trim();
    }
    if (typeof updateMeDto.email === 'string') {
      const email = updateMeDto.email.trim().toLowerCase();
      const existing = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
      data.email = email;
    }
    if (typeof updateMeDto.phone === 'string') {
      data.phone = updateMeDto.phone.trim();
    }

    // If nothing to update, return current state
    if (Object.keys(data).length === 0) {
      return this.getCurrentUser(userId);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        pictureUrl: true,
        role: true,
        verified: true,
        phone: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async updateProfilePicture(userId: string, pictureUrl: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pictureUrl,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        pictureUrl: true,
        role: true,
        verified: true,
        phone: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async changePassword(
    userId: string,
    params: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.password) {
      throw new BadRequestException('Password change is not available for this account');
    }

    const currentValid = await bcrypt.compare(params.currentPassword, user.password);
    if (!currentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const sameAsCurrent = await bcrypt.compare(params.newPassword, user.password);
    if (sameAsCurrent) {
      throw new BadRequestException('New password must be different from your current password');
    }

    const hashedPassword = await bcrypt.hash(params.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async validateOAuthUser(
    profile: any,
    provider: 'google' | 'apple',
    preferredRole?: 'homeowner' | 'general_contractor',
  ) {
    const email = profile.email;
    if (!email) {
      throw new UnauthorizedException('Email is required for OAuth authentication');
    }

    const fullName = profile.name ||
      (profile.firstName && profile.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : profile.firstName || profile.lastName || 'User');

    const pictureUrl = profile.picture || profile.photo || null;
    const roleToCreate = preferredRole === 'general_contractor' ? 'general_contractor' : 'homeowner';

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user from OAuth
      // Generate a random password hash for OAuth users (they won't use it)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      user = await this.prisma.user.create({
        data: {
          email,
          password: randomPassword, // OAuth users have random password (not used)
          fullName,
          pictureUrl,
          role: roleToCreate,
          verified: true, // OAuth providers verify emails
        },
      });

      // Ensure GC profile exists when user signs up through the contractor app.
      if (roleToCreate === 'general_contractor') {
        await this.prisma.contractor.create({
          data: {
            userId: user.id,
            name: fullName || 'General Contractor',
            specialty: 'General Contractor',
            specialtyCategory: 'general_contractor',
            specialtyTags: ['General Contractor'],
            rating: 5.0,
            projects: 10,
            type: 'general_contractor',
            hiringFee: 0,
          },
        });
      }

      await this.notifyAdminNewSignup(fullName, email, roleToCreate);
      await this.sendHomeownerWelcomeEmail(user.email, user.fullName, roleToCreate);
      await this.sendGeneralContractorWelcomeEmail(user.email, roleToCreate);
    } else {
      // Keep profile in sync with trusted OAuth identity values.
      const currentName = (user.fullName || '').trim();
      const oauthName = (fullName || '').trim();
      const shouldUpdateName =
        !!oauthName &&
        (currentName === '' || currentName.toLowerCase() === 'user' || currentName !== oauthName);
      const shouldUpdatePicture = !!pictureUrl && user.pictureUrl !== pictureUrl;

      if (shouldUpdateName || shouldUpdatePicture) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...(shouldUpdatePicture ? { pictureUrl } : {}),
            ...(shouldUpdateName ? { fullName: oauthName } : {}),
          },
        });
      }

      // Backfill contractor profile if role is GC but profile row is missing.
      if (user.role === 'general_contractor') {
        const existingContractor = await this.prisma.contractor.findUnique({
          where: { userId: user.id },
        });
        if (!existingContractor) {
          await this.prisma.contractor.create({
            data: {
              userId: user.id,
              name: user.fullName || fullName || 'General Contractor',
              specialty: 'General Contractor',
              specialtyCategory: 'general_contractor',
              specialtyTags: ['General Contractor'],
              rating: 5.0,
              projects: 10,
              type: 'general_contractor',
              hiringFee: 0,
            },
          });
        } else if (oauthName && existingContractor.name !== oauthName) {
          await this.prisma.contractor.update({
            where: { userId: user.id },
            data: { name: oauthName },
          });
        }
      }
    }

    // Generate JWT token
    const token = await this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        pictureUrl: user.pictureUrl,
        role: user.role,
        verified: user.verified,
      },
    };
  }

  private async notifyAdminNewSignup(fullName: string, email: string, role: string) {
    await this.wsService.sendNotificationToRole('admin', {
      type: 'new_user_signup',
      title: 'New user signup',
      message: `${fullName} (${email}) signed up as ${role}`,
      data: { email, fullName, role },
    });
  }

  private async sendHomeownerWelcomeEmail(email: string, fullName: string | null, role: string) {
    if (role !== 'homeowner' || !email) {
      return;
    }

    const html = HOMEOWNER_WELCOME_EMAIL_TEMPLATE
      .replace(/\{\{\s*unsubscribe\s*\}\}/gi, 'https://buildmyhouse.app')
      .replace(/\{\{\s*update_preferences\s*\}\}/gi, 'https://buildmyhouse.app')
      .replace(/\{\{\s*view_in_browser\s*\}\}/gi, 'https://buildmyhouse.app')
      .replace(/\{\{\s*full_name\s*\}\}/gi, this.escapeHtml(fullName || 'there'));

    try {
      await this.emailService.send({
        to: email,
        subject: 'Welcome to BuildMyHouse',
        html,
      });
    } catch {
      // Never block signup due to email delivery issues.
    }
  }

  private async sendGeneralContractorWelcomeEmail(email: string, role: string) {
    if (role !== 'general_contractor' || !email) {
      return;
    }

    const html = GC_WELCOME_EMAIL_TEMPLATE
      .replace(/\{\{\s*unsubscribe\s*\}\}/gi, 'https://buildmyhouse.app')
      .replace(/\{\{\s*update_preferences\s*\}\}/gi, 'https://buildmyhouse.app')
      .replace(/\{\{\s*view_in_browser\s*\}\}/gi, 'https://buildmyhouse.app');

    try {
      await this.emailService.send({
        to: email,
        subject: 'Welcome to BuildMyHouse',
        html,
      });
    } catch {
      // Never block signup due to email delivery issues.
    }
  }

  private hashPasswordResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getPasswordResetUrl(role: string, token: string) {
    const baseUrl =
      role === 'general_contractor'
        ? this.configService.get<string>('CONTRACTOR_APP_URL') || 'https://gc.buildmyhouse.app'
        : this.configService.get<string>('HOMEOWNER_APP_URL') || 'https://buildmyhouse.app';

    const url = new URL('/reset-password', baseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private async sendPasswordResetEmail(params: {
    email: string;
    fullName: string | null;
    role: string;
    token: string;
    expiresAt: Date;
  }) {
    const resetUrl = this.getPasswordResetUrl(params.role, params.token);
    const safeName = this.escapeHtml(params.fullName || 'there');
    const safeResetUrl = this.escapeHtml(resetUrl);
    const expiresAt = params.expiresAt.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your BuildMyHouse password</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background-color:#f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:0 auto; padding:24px;">
    <tr>
      <td style="background-color:#ffffff; border-radius:12px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h1 style="margin:0 0 8px 0; font-size:22px; color:#111827;">Reset your password</h1>
        <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#374151;">Hi ${safeName},</p>
        <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#374151;">
          We received a request to reset your BuildMyHouse password. Tap the button below to choose a new password.
        </p>
        <a href="${safeResetUrl}" style="display:inline-block; background-color:#111827; color:#ffffff; text-decoration:none; font-weight:600; padding:14px 20px; border-radius:10px;">
          Reset password
        </a>
        <p style="margin:24px 0 0 0; font-size:13px; line-height:1.6; color:#6b7280;">
          This link expires at ${this.escapeHtml(expiresAt)}. If you did not request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    await this.emailService.send({
      to: params.email,
      subject: 'Reset your BuildMyHouse password',
      html,
      text: `Reset your BuildMyHouse password: ${resetUrl}\n\nThis link expires at ${expiresAt}.`,
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

  private async generateToken(userId: string, email: string, role: string): Promise<string> {
    const payload: JWTPayload = {
      sub: userId,
      email,
      role,
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret || !secret.trim()) {
      throw new Error('JWT_SECRET is required. Set it in your .env file.');
    }
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '7d',
    });
  }
}




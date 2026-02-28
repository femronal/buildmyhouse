import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthService, JWTPayload } from './jwt-auth.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, role, phone } = registerDto;

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
        role,
        phone,
        verified: role === 'admin', // Auto-verify admins
      },
    });

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
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (!user.password) {
      throw new UnauthorizedException('User account not properly configured');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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

  async validateOAuthUser(profile: any, provider: 'google' | 'apple') {
    const email = profile.email;
    if (!email) {
      throw new UnauthorizedException('Email is required for OAuth authentication');
    }

    const fullName = profile.name || 
      (profile.firstName && profile.lastName 
        ? `${profile.firstName} ${profile.lastName}` 
        : profile.firstName || profile.lastName || 'User');
    
    const pictureUrl = profile.picture || profile.photo || null;

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
          role: 'homeowner', // Default role, can be changed later
          verified: true, // OAuth providers verify emails
        },
      });
    } else {
      // Update existing user's name and picture if they're not set or if OAuth provides newer info
      if (!user.pictureUrl && pictureUrl) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            pictureUrl,
            fullName: user.fullName || fullName, // Only update if not set
          },
        });
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

  private async generateToken(userId: string, email: string, role: string): Promise<string> {
    const payload: JWTPayload = {
      sub: userId,
      email,
      role,
    };

    const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '7d',
    });
  }
}




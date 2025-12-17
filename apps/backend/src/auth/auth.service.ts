import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthService, JWTPayload } from './jwt-auth.service';

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


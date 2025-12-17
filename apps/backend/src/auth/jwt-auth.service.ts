import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JWTPayload {
  sub: string; // userId
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verify JWT token and extract payload
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const payload = await this.jwtService.verifyAsync<JWTPayload>(token, {
        secret,
      });

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract token from Socket.io handshake
   */
  extractTokenFromHandshake(auth: any): string | null {
    // Try different ways tokens might be passed
    if (auth?.token) {
      return auth.token;
    }
    if (auth?.authorization) {
      // Handle "Bearer <token>" format
      const parts = auth.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
      return auth.authorization;
    }
    return null;
  }
}


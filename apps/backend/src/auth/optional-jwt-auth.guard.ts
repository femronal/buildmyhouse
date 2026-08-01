import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthService, JWTPayload } from './jwt-auth.service';

/**
 * Optional authentication: attaches request.user when a valid Bearer token is
 * present, and continues anonymously otherwise. Used by consumer surfaces
 * (e.g. the Price Checker free tier) where login must never be forced before
 * the user sees value.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthService: JwtAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;
    if (!authHeader) return true;

    const parts = authHeader.split(' ');
    const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : authHeader;
    try {
      const payload: JWTPayload = await this.jwtAuthService.verifyToken(token);
      request.user = { sub: payload.sub, email: payload.email, role: payload.role };
    } catch {
      // Invalid/expired token → proceed anonymously; protected actions still
      // require real auth via JwtAuthGuard.
    }
    return true;
  }
}

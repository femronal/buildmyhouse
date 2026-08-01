import { ForbiddenException } from '@nestjs/common';
import { PiPermission, assertPermission, hasPermission } from './permissions';

export interface AdminRequestUser {
  sub: string;
  email?: string;
  role?: string;
  priceIntelligencePermissions?: string[];
}

export function adminId(user: AdminRequestUser | undefined): string {
  if (!user?.sub) throw new ForbiddenException('Admin identity required');
  return user.sub;
}

export function requirePiPermission(
  grants: readonly string[] | null | undefined,
  required: PiPermission | readonly PiPermission[],
): void {
  try {
    assertPermission(grants, required);
  } catch (err) {
    throw new ForbiddenException((err as Error).message);
  }
}

export function checkPiPermission(
  grants: readonly string[] | null | undefined,
  required: PiPermission | readonly PiPermission[],
): boolean {
  return hasPermission(grants, required);
}

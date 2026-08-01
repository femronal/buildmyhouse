/**
 * Stage 8 — Price Intelligence admin sub-permissions.
 *
 * Empty permissions array = ALL PI permissions (backward compatible for
 * existing admins who have no explicit grant list).
 */

export const PI_PERMISSIONS = [
  'VIEW',
  'REVIEW',
  'ENTRY',
  'CATALOGUE',
  'SOURCE_ADMIN',
  'SETTINGS',
  'AUDIT_EXPORT',
  'SUPER_ADMIN',
] as const;

export type PiPermission = (typeof PI_PERMISSIONS)[number];

export function isPiPermission(value: string): value is PiPermission {
  return (PI_PERMISSIONS as readonly string[]).includes(value);
}

/**
 * Resolve effective permission set.
 * Empty/null/undefined grants = all permissions (backward compatible).
 */
export function resolvePermissions(grants: readonly string[] | null | undefined): ReadonlySet<PiPermission> {
  if (!grants || grants.length === 0) {
    return new Set(PI_PERMISSIONS);
  }
  const resolved = new Set<PiPermission>();
  for (const g of grants) {
    if (isPiPermission(g)) resolved.add(g);
  }
  // SUPER_ADMIN implies everything
  if (resolved.has('SUPER_ADMIN')) {
    return new Set(PI_PERMISSIONS);
  }
  return resolved;
}

export function hasPermission(
  grants: readonly string[] | null | undefined,
  required: PiPermission | readonly PiPermission[],
): boolean {
  const resolved = resolvePermissions(grants);
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((p) => resolved.has(p));
}

export function hasAnyPermission(
  grants: readonly string[] | null | undefined,
  required: readonly PiPermission[],
): boolean {
  const resolved = resolvePermissions(grants);
  return required.some((p) => resolved.has(p));
}

/** Maker-checker: creator cannot approve own entry unless SUPER_ADMIN. */
export function canApproveOwnEntry(grants: readonly string[] | null | undefined): boolean {
  return hasPermission(grants, 'SUPER_ADMIN');
}

export function assertPermission(
  grants: readonly string[] | null | undefined,
  required: PiPermission | readonly PiPermission[],
): void {
  if (!hasPermission(grants, required)) {
    const needed = Array.isArray(required) ? required.join(', ') : required;
    throw new Error(`Missing Price Intelligence permission: ${needed}`);
  }
}

import {
  resolvePermissions,
  hasPermission,
  hasAnyPermission,
  canApproveOwnEntry,
  assertPermission,
  PI_PERMISSIONS,
} from './permissions';

describe('permissions', () => {
  it('empty grants resolve to all permissions', () => {
    expect(resolvePermissions([])).toEqual(new Set(PI_PERMISSIONS));
    expect(resolvePermissions(null)).toEqual(new Set(PI_PERMISSIONS));
    expect(resolvePermissions(undefined)).toEqual(new Set(PI_PERMISSIONS));
  });

  it('explicit grants are respected', () => {
    const set = resolvePermissions(['VIEW', 'REVIEW']);
    expect(set.has('VIEW')).toBe(true);
    expect(set.has('REVIEW')).toBe(true);
    expect(set.has('SETTINGS')).toBe(false);
  });

  it('SUPER_ADMIN expands to all', () => {
    expect(resolvePermissions(['SUPER_ADMIN'])).toEqual(new Set(PI_PERMISSIONS));
  });

  it('hasPermission / hasAnyPermission', () => {
    expect(hasPermission(['VIEW'], 'VIEW')).toBe(true);
    expect(hasPermission(['VIEW'], 'REVIEW')).toBe(false);
    expect(hasPermission(['VIEW', 'REVIEW'], ['VIEW', 'REVIEW'])).toBe(true);
    expect(hasAnyPermission(['ENTRY'], ['REVIEW', 'ENTRY'])).toBe(true);
    expect(hasAnyPermission(['VIEW'], ['REVIEW', 'ENTRY'])).toBe(false);
  });

  it('maker-checker: only SUPER_ADMIN can approve own entry', () => {
    expect(canApproveOwnEntry([])).toBe(true); // empty = all
    expect(canApproveOwnEntry(['REVIEW', 'ENTRY'])).toBe(false);
    expect(canApproveOwnEntry(['SUPER_ADMIN'])).toBe(true);
  });

  it('assertPermission throws when missing', () => {
    expect(() => assertPermission(['VIEW'], 'SETTINGS')).toThrow(/SETTINGS/);
    expect(() => assertPermission(['SETTINGS'], 'SETTINGS')).not.toThrow();
  });
});

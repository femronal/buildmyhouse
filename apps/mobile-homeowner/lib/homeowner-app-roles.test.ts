import {
  canSignInOnHomeownerApp,
  isVendorPortalReturnPath,
  registerRoleForReturnPath,
} from './homeowner-app-roles';

describe('homeowner app roles', () => {
  it('lets homeowners and claimed vendors sign in on the public web app', () => {
    expect(canSignInOnHomeownerApp('homeowner')).toBe(true);
    expect(canSignInOnHomeownerApp('vendor')).toBe(true);
    expect(canSignInOnHomeownerApp('general_contractor')).toBe(false);
    expect(canSignInOnHomeownerApp('admin')).toBe(false);
    expect(canSignInOnHomeownerApp(null)).toBe(false);
  });

  it('registers claim/manage return paths as vendor so login is not blocked after claim', () => {
    expect(isVendorPortalReturnPath('/vendors/claim/abc')).toBe(true);
    expect(isVendorPortalReturnPath('/vendors/manage')).toBe(true);
    expect(isVendorPortalReturnPath('/house-summary?designId=1')).toBe(false);
    expect(registerRoleForReturnPath('/vendors/claim/abc')).toBe('vendor');
    expect(registerRoleForReturnPath('/house-summary')).toBe('homeowner');
  });
});

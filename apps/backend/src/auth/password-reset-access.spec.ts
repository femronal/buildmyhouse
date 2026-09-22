import { canResetPasswordForRequestedApp } from './password-reset-access';

describe('canResetPasswordForRequestedApp', () => {
  it('lets claimed vendors reset from the homeowner web app', () => {
    expect(canResetPasswordForRequestedApp('vendor', 'homeowner')).toBe(true);
    expect(canResetPasswordForRequestedApp('homeowner', 'homeowner')).toBe(true);
    expect(canResetPasswordForRequestedApp('vendor', 'general_contractor')).toBe(false);
    expect(canResetPasswordForRequestedApp('general_contractor', 'homeowner')).toBe(false);
    expect(canResetPasswordForRequestedApp('admin', 'homeowner')).toBe(false);
  });
});

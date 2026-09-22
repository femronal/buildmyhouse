import {
  buildAuthContinueHref,
  postAuthContinueMessage,
  vendorClaimPath,
} from './vendor-claim-flow';

describe('vendor claim flow helpers', () => {
  it('builds signup and sign-in URLs that return to the claim token', () => {
    const token = '9959c1192fe50a8d6ffc659e468ccfa3c04843102e25b67553fb5b1a24692d5d';
    const destination = vendorClaimPath(token);
    expect(destination).toBe(`/vendors/claim/${token}`);

    const signup = buildAuthContinueHref(destination, 'signup');
    expect(signup.startsWith('/email-login?')).toBe(true);
    expect(signup).toContain('mode=signup');
    expect(signup).toContain(`returnTo=${encodeURIComponent(destination)}`);

    const signin = buildAuthContinueHref('/vendors/manage', 'signin');
    expect(signin).toContain('mode=signin');
    expect(signin).toContain(`returnTo=${encodeURIComponent('/vendors/manage')}`);
  });

  it('rejects open-redirect return paths', () => {
    expect(buildAuthContinueHref('https://evil.example/phish', 'signup')).toBe('/email-login?mode=signup');
    expect(buildAuthContinueHref('//evil.example', 'signup')).toBe('/email-login?mode=signup');
  });

  it('explains the claim return path instead of house-plan copy', () => {
    expect(postAuthContinueMessage('/vendors/claim/abc')).toMatch(/claim this vendor profile/i);
    expect(postAuthContinueMessage('/vendors/manage')).toMatch(/manage your vendor listing/i);
    expect(postAuthContinueMessage('/house-summary')).toMatch(/where you left off/i);
    expect(postAuthContinueMessage(null)).toBeNull();
  });
});

import { normalizePostAuthReturnPath } from './post-auth-navigation';

describe('normalizePostAuthReturnPath', () => {
  it('accepts in-app claim and manage paths', () => {
    expect(normalizePostAuthReturnPath('/vendors/claim/abc123')).toBe('/vendors/claim/abc123');
    expect(normalizePostAuthReturnPath('/vendors/manage')).toBe('/vendors/manage');
  });

  it('rejects open redirects', () => {
    expect(normalizePostAuthReturnPath('https://evil.example/x')).toBeNull();
    expect(normalizePostAuthReturnPath('//evil.example')).toBeNull();
    expect(normalizePostAuthReturnPath('email-login')).toBeNull();
    expect(normalizePostAuthReturnPath('')).toBeNull();
  });
});

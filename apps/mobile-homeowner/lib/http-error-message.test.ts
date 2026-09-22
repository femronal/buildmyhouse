import { httpErrorMessage } from './http-error-message';

describe('httpErrorMessage', () => {
  it('prefers a string message', () => {
    expect(httpErrorMessage({ message: 'Invite has expired' }, 'fallback')).toBe('Invite has expired');
  });

  it('joins Nest validation arrays so submit errors are visible', () => {
    expect(
      httpErrorMessage({ message: ['websiteUrl must be a URL', 'publicEmail must be an email'] }, 'fallback'),
    ).toBe('websiteUrl must be a URL publicEmail must be an email');
  });

  it('falls back when message is missing', () => {
    expect(httpErrorMessage({}, 'Unable to submit')).toBe('Unable to submit');
  });
});

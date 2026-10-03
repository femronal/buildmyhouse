import { deriveProofStatus } from './gc-verification-documents';

describe('deriveProofStatus', () => {
  const answers = [null, 'added', 'not_have', 'not_applicable'] as const;
  const reviews = [null, 'unchecked', 'passed', 'failed'] as const;

  it('covers answer, file and review combinations', () => {
    for (const answer of answers) {
      for (const hasFile of [false, true]) {
        for (const reviewStatus of reviews) {
          const status = deriveProofStatus({ answer, hasFile, reviewStatus });
          if (reviewStatus === 'passed') expect(status).toBe('checked');
          else if (reviewStatus === 'failed') expect(status).toBe('did_not_pass');
          else if (hasFile) expect(status).toBe('received');
          else if (answer === 'added') expect(status).toBe('says_has');
          else if (answer === 'not_have') expect(status).toBe('not_have');
          else if (answer === 'not_applicable') expect(status).toBe('not_applicable');
          else expect(status).toBe('not_answered');
        }
      }
    }
  });
});

import { buildJoinChecklist } from './join-checklist';

describe('buildJoinChecklist', () => {
  it('never returns a score and skips claimed, website and email', () => {
    const rows = buildJoinChecklist('cleaning', { state: 'lagos', area: ['ikeja'] });
    expect(rows.length).toBeLessThanOrEqual(5);
    expect(rows.some((row) => row.key === 'claimed' || row.key === 'website' || row.key === 'email')).toBe(false);
    expect(JSON.stringify(rows)).not.toMatch(/\d+%/);
  });

  it('lists missing proof for other paths', () => {
    const rows = buildJoinChecklist('materials', { proofs: { cac: 'not_have' }, photos: 'skip' });
    expect(rows.length).toBeLessThanOrEqual(5);
    expect(rows.some((row) => row.key === 'cac')).toBe(true);
  });
});

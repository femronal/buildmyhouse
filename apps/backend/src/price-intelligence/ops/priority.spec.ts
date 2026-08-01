import { computePriority } from './priority';

describe('priority', () => {
  it('scores low-confidence paid impact as high/critical', () => {
    const r = computePriority({
      caseType: 'low_confidence',
      confidenceLabel: 'low',
      confidenceScore: 0.3,
      paidCustomerImpactCount: 1,
    });
    expect(r.overridden).toBe(false);
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(['high', 'critical']).toContain(r.label);
    expect(r.reason).toMatch(/low confidence/);
  });

  it('scores insufficient_data lower without paid impact', () => {
    const r = computePriority({
      caseType: 'insufficient_data',
      confidenceLabel: 'insufficient_data',
      paidCustomerImpactCount: 0,
    });
    expect(r.label).toMatch(/medium|high|low/);
    expect(r.score).toBeLessThan(90);
  });

  it('override requires reason', () => {
    expect(() =>
      computePriority({ caseType: 'low_confidence', overrideLabel: 'critical', overrideReason: '' }),
    ).toThrow(/reason/);
  });

  it('override with reason wins', () => {
    const r = computePriority({
      caseType: 'low_confidence',
      overrideLabel: 'low',
      overrideReason: 'duplicate of case X',
    });
    expect(r.label).toBe('low');
    expect(r.score).toBe(25);
    expect(r.overridden).toBe(true);
    expect(r.reason).toMatch(/Override/);
  });

  it('is deterministic for identical inputs', () => {
    const a = computePriority({ caseType: 'outlier', sourceFailing: true, customerImpactCount: 3 });
    const b = computePriority({ caseType: 'outlier', sourceFailing: true, customerImpactCount: 3 });
    expect(a).toEqual(b);
  });
});

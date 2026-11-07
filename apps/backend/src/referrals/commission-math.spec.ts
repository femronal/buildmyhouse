import { commissionExample, decideCommission, maskHomeownerName, pipelineStage } from './commission-math';

describe('decideCommission', () => {
  const ready = {
    contractorAmount: 50_000_000,
    confirmedPayments: 55_000_000,
    rateBps: 250,
    projectCompleted: true,
    agreementActive: true,
    selfReferral: false,
    contractorConflict: false,
  };

  it('pays 2.5% of a ₦50 million contractor amount and leaves contingency untouched', () => {
    const decision = decideCommission(ready);
    expect(decision.action).toBe('record');
    expect(decision.status).toBe('awaiting_checks');
    expect(decision.amount).toBe(1_250_000);
    expect(decision.controllingFeeAmount).toBe(5_000_000);
    expect(decision.contingencyAmount).toBe(10_000_000);
    expect(decision.amount).toBeLessThan(decision.controllingFeeAmount);
    expect(decision.contingencyAmount).not.toBe(decision.amount);

    const example = commissionExample();
    expect(example.commission).toBe(1_250_000);
    expect(example.bmhRetainedControllingFee).toBe(3_750_000);
    expect(example.contingencyAmount).toBe(10_000_000);
  });

  it('does not fund the commission from contingency when the controlling fee is smaller than the rate', () => {
    const decision = decideCommission({
      ...ready,
      contractorAmount: 50_000_000,
      monitoringFee: 1_000_000,
      coordinationFee: 0,
      contingencyFee: 10_000_000,
      confirmedPayments: 51_000_000,
      rateBps: 250,
    });
    expect(decision.action).toBe('record');
    expect(decision.controllingFeeAmount).toBe(1_000_000);
    expect(decision.amount).toBe(1_000_000);
    expect(decision.contingencyAmount).toBe(10_000_000);
  });

  it('skips a completed project until the controlling fee is confirmed', () => {
    const decision = decideCommission({ ...ready, confirmedPayments: 50_000_000 });
    expect(decision.action).toBe('skip');
    expect(decision.reasons.join(' ')).toMatch(/controlling fee/i);
  });

  it('skips when the project was not completed through stage approval', () => {
    const decision = decideCommission({ ...ready, projectCompleted: false });
    expect(decision.action).toBe('skip');
    expect(decision.reasons.join(' ')).toMatch(/stage approval/i);
  });

  it('keeps a self-referral and a contractor conflict in review', () => {
    expect(decideCommission({ ...ready, selfReferral: true }).status).toBe('needs_review');
    expect(decideCommission({ ...ready, contractorConflict: true }).status).toBe('needs_review');
    expect(decideCommission({ ...ready, selfReferral: true }).action).toBe('record');
  });

  it('masks a homeowner and picks the furthest pipeline stage', () => {
    expect(maskHomeownerName('Adaeze Okonkwo')).toBe('Adaeze O.');
    expect(pipelineStage(['draft', 'completed'])).toBe('completed');
    expect(pipelineStage(['draft'])).toBe('enquiry');
    expect(pipelineStage([])).toBe('registered');
  });
});

import { buildInspectionScope, normalizeSubmittedStages, parsePricedLines } from './quote-scope';

describe('inspection quote scope', () => {
  it('turns a lump sum into stages that add up to the signed total', () => {
    const scope = buildInspectionScope({
      signedTotal: 100000,
      paymentModel: 'pay_by_stage',
      quoteText: 'Washing machine repair\nTotal ₦100,000',
      cataloguePhases: [
        { name: 'Inspection', description: 'The fault is written down.', estimatedCost: 7000, estimatedDuration: '1 hour' },
        { name: 'Repair', description: 'The machine completes a wash cycle.', estimatedCost: 70000, estimatedDuration: '1 day' },
        { name: 'Handover', description: 'The homeowner has seen it run.', estimatedCost: 23000, estimatedDuration: '30 minutes' },
      ],
      fileReadable: true,
    });

    expect(scope.lumpSum).toBe(true);
    expect(scope.notice).toContain('Your quote is not staged');
    expect(scope.stages).toHaveLength(3);
    const total = scope.stages.reduce((sum, stage) => sum + stage.amount, 0);
    expect(Math.round(total)).toBe(100000);
    expect(Math.max(...scope.stages.map((stage) => stage.amount))).toBeLessThanOrEqual(60000);
    expect(scope.contractorAmount).toBe(100000);
    expect(scope.totalPayable).toBeGreaterThan(scope.contractorAmount);
    expect(scope.stages.every((stage) => stage.doneWhen.length > 0)).toBe(true);
  });

  it('keeps the checks the quote analysis attached to each stage', () => {
    const scope = buildInspectionScope({
      signedTotal: 100000,
      paymentModel: 'pay_by_stage',
      quoteText: 'One price for the whole repair',
      suggestion: {
        lumpSum: true,
        stages: [
          { name: 'Repair', doneWhen: 'The machine completes a wash cycle.', weight: 0.6, evidence: ['The cycle finishes without stopping.', 'The inlet hose does not leak.'] },
          { name: 'Handover', doneWhen: 'The homeowner has seen it run.', weight: 0.4, evidence: ['The machine is demonstrated.', 'The work area is left clear.'] },
        ],
      },
      fileReadable: true,
    });
    expect(scope.stages[0].evidence).toEqual(['The cycle finishes without stopping.', 'The inlet hose does not leak.']);
    expect(scope.stages[1].evidence).toEqual(['The machine is demonstrated.', 'The work area is left clear.']);
  });

  it('keeps priced lines from a quote that already has stages', () => {
    const lines = parsePricedLines('Foundation ₦40,000\nBlockwork ₦60,000');
    expect(lines).toHaveLength(2);
    const scope = buildInspectionScope({
      signedTotal: 100000,
      paymentModel: 'pay_in_full',
      quoteText: 'Foundation ₦40,000\nBlockwork ₦60,000',
      fileReadable: true,
    });
    expect(scope.lumpSum).toBe(false);
    expect(scope.stages.map((stage) => stage.name)).toEqual(['Foundation', 'Blockwork']);
    expect(scope.stages.reduce((sum, stage) => sum + stage.amount, 0)).toBe(100000);
  });

  it('does not treat the catalogue design as something to edit', () => {
    const catalogue = [{ name: 'Published plan', estimatedCost: 50000 }];
    buildInspectionScope({ signedTotal: 80000, paymentModel: 'pay_by_stage', cataloguePhases: catalogue });
    expect(catalogue[0].estimatedCost).toBe(50000);
  });

  it('rejects a stage that takes almost the whole quote', () => {
    expect(() =>
      normalizeSubmittedStages(100000, [
        { name: 'Mobilisation', doneWhen: 'Materials are on site.', amount: 90000, duration: '1 day' },
        { name: 'Finish', doneWhen: 'Work is photographed.', amount: 10000, duration: '1 day' },
      ]),
    ).toThrow(/75%/);
  });

  it('lets a full payment put most of the quote into the materials stage', () => {
    const stages = normalizeSubmittedStages(100000, [
      { name: 'Materials and mobilisation', doneWhen: 'Materials for the whole job are on site.', amount: 90000, duration: '1 day' },
      { name: 'Finish', doneWhen: 'The homeowner has seen the finished work.', amount: 10000, duration: '1 day' },
    ], 'pay_in_full');
    expect(stages[0].amount).toBe(90000);
  });

  it('adds each stage deposit so the deposits match the invoice', () => {
    const scope = buildInspectionScope({
      signedTotal: 100000,
      paymentModel: 'pay_by_stage',
      quoteText: 'Foundation ₦40,000\nBlockwork ₦60,000',
      fileReadable: true,
    });
    const deposits = scope.stages.reduce((sum, stage) => sum + Number(stage.deposit || 0), 0);
    expect(Math.round(deposits * 100) / 100).toBe(scope.totalPayable);
    expect(Number(scope.stages[0].deposit)).toBeGreaterThan(scope.stages[0].amount);
  });

  it('does not publish stages when the payment choice is missing', () => {
    expect(() => buildInspectionScope({ signedTotal: 80000 })).toThrow(/pay in full or pay stage by stage/);
  });

  it('rejects stages that do not add up to the signed quote', () => {
    expect(() =>
      normalizeSubmittedStages(100000, [
        { name: 'One', doneWhen: 'Done.', amount: 20000, duration: '1 day' },
        { name: 'Two', doneWhen: 'Done.', amount: 20000, duration: '1 day' },
      ]),
    ).toThrow(/add up/);
  });
});

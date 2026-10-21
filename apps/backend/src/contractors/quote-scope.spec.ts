import { buildInspectionScope, normalizeSubmittedStages, parsePricedLines } from './quote-scope';

describe('inspection quote scope', () => {
  it('turns a lump sum into stages that add up to the signed total', () => {
    const scope = buildInspectionScope({
      signedTotal: 100000,
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

  it('keeps priced lines from a quote that already has stages', () => {
    const lines = parsePricedLines('Foundation ₦40,000\nBlockwork ₦60,000');
    expect(lines).toHaveLength(2);
    const scope = buildInspectionScope({
      signedTotal: 100000,
      quoteText: 'Foundation ₦40,000\nBlockwork ₦60,000',
      fileReadable: true,
    });
    expect(scope.lumpSum).toBe(false);
    expect(scope.stages.map((stage) => stage.name)).toEqual(['Foundation', 'Blockwork']);
    expect(scope.stages.reduce((sum, stage) => sum + stage.amount, 0)).toBe(100000);
  });

  it('does not treat the catalogue design as something to edit', () => {
    const catalogue = [{ name: 'Published plan', estimatedCost: 50000 }];
    buildInspectionScope({ signedTotal: 80000, cataloguePhases: catalogue });
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

  it('rejects stages that do not add up to the signed quote', () => {
    expect(() =>
      normalizeSubmittedStages(100000, [
        { name: 'One', doneWhen: 'Done.', amount: 20000, duration: '1 day' },
        { name: 'Two', doneWhen: 'Done.', amount: 20000, duration: '1 day' },
      ]),
    ).toThrow(/add up/);
  });
});

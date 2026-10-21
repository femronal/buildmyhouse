import { applyDescribedEvidence, fallbackEvidence, parseDescribedStages, reviewForStage } from './stage-evidence';

describe('stage evidence', () => {
  it('reads the checklist the quote analysis returned', () => {
    const parsed = parseDescribedStages({
      stages: [
        {
          name: 'Repair',
          doneWhen: 'The machine completes a wash cycle.',
          evidence: ['The machine finishes a wash without stopping.', 'The drain hose does not leak.', 'short'],
        },
      ],
    });
    expect(parsed).toEqual([
      {
        name: 'Repair',
        doneWhen: 'The machine completes a wash cycle.',
        evidence: ['The machine finishes a wash without stopping.', 'The drain hose does not leak.'],
      },
    ]);
  });

  it('keeps a specific done line and fills checks from the quote', () => {
    const stages = applyDescribedEvidence(
      [{ name: 'Repair', doneWhen: 'The machine completes a wash cycle.', evidence: [] }],
      [{ name: 'Repair', doneWhen: 'A vaguer line.', evidence: ['The drum turns through a full cycle.', 'No leak at the inlet hose.'] }],
    );
    expect(stages[0].doneWhen).toBe('The machine completes a wash cycle.');
    expect(stages[0].evidence).toEqual(['The drum turns through a full cycle.', 'No leak at the inlet hose.']);
  });

  it('replaces a generic done line and still lists checks when the quote analysis is missing', () => {
    const stages = applyDescribedEvidence(
      [{ name: 'Repair', doneWhen: 'This stage is done when repair is finished and photographed.', evidence: [] }],
      null,
    );
    expect(stages[0].doneWhen).toMatch(/finished and photographed/);
    expect(stages[0].evidence?.length).toBeGreaterThanOrEqual(4);
    expect(fallbackEvidence('Repair', stages[0].doneWhen).join(' ')).not.toMatch(/1 photo/);
  });

  it('uses the stored checklist for the stage the homeowner is reviewing', () => {
    const review = reviewForStage(
      { name: 'Repair' },
      { name: 'Repair', doneWhen: 'The machine completes a wash cycle.', evidenceToReview: ['The cycle finishes.', 'The machine is dry underneath.'] },
    );
    expect(review.objective).toBe('The machine completes a wash cycle.');
    expect(review.checks).toHaveLength(2);
  });
});

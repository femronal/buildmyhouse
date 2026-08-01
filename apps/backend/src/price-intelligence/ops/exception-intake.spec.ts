import { computePriority } from './priority';

/**
 * Exception intake gate logic (mirrors ExceptionIntakeService decisions).
 * High-confidence auto deliveries must not create cases.
 */
function shouldCreateCase(args: {
  status: string;
  confidenceLabel: string;
  confidenceScore: number | null;
  threshold: number;
}): { create: boolean; caseType?: string } {
  const label = args.confidenceLabel.toLowerCase();
  const isInsufficient = args.status === 'insufficient_data' || label === 'insufficient_data';
  const isLowConfidence =
    !isInsufficient &&
    (label === 'low' || (args.confidenceScore !== null && args.confidenceScore < args.threshold));
  if (!isInsufficient && !isLowConfidence) return { create: false };
  return { create: true, caseType: isInsufficient ? 'insufficient_data' : 'low_confidence' };
}

describe('exception intake gates', () => {
  it('does not create cases for high-confidence deliveries', () => {
    expect(
      shouldCreateCase({
        status: 'complete',
        confidenceLabel: 'high',
        confidenceScore: 0.85,
        threshold: 0.5,
      }),
    ).toEqual({ create: false });
  });

  it('does not create cases for moderate confidence above threshold', () => {
    expect(
      shouldCreateCase({
        status: 'complete',
        confidenceLabel: 'moderate',
        confidenceScore: 0.6,
        threshold: 0.5,
      }),
    ).toEqual({ create: false });
  });

  it('creates insufficient_data cases', () => {
    expect(
      shouldCreateCase({
        status: 'insufficient_data',
        confidenceLabel: 'insufficient_data',
        confidenceScore: 0,
        threshold: 0.5,
      }),
    ).toEqual({ create: true, caseType: 'insufficient_data' });
  });

  it('creates low_confidence cases', () => {
    expect(
      shouldCreateCase({
        status: 'complete',
        confidenceLabel: 'low',
        confidenceScore: 0.35,
        threshold: 0.5,
      }),
    ).toEqual({ create: true, caseType: 'low_confidence' });
  });

  it('priority for paid low-confidence is elevated', () => {
    const p = computePriority({
      caseType: 'low_confidence',
      confidenceLabel: 'low',
      paidCustomerImpactCount: 1,
    });
    expect(p.score).toBeGreaterThanOrEqual(70);
  });
});

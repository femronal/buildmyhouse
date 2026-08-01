import {
  assessEscalation,
  decideReadiness,
  enrichMatrixFromFamily,
  isHumanReviewRequired,
  MATRIX_SCHEMA_VERSION,
  SAFETY_DISCLAIMER,
  SAFETY_SENSITIVE_FAMILIES,
  TemporaryMatrix,
  validateProposedConversions,
  validateTemporaryMatrix,
} from './matrix';
import { canPublishPromotedFamily } from './custom-research';

function validMatrix(overrides: Partial<TemporaryMatrix> = {}): TemporaryMatrix {
  return {
    requestId: 'req-123',
    rawProductName: '12mm iron rod',
    canonicalProductName: 'Reinforcement steel, 12 mm deformed bar',
    matchedFamilyId: 'reinforcement-steel',
    matchConfidence: 0.95,
    productType: 'product',
    aliasesDetected: ['iron rod', 'y12'],
    intendedUse: 'Ground-floor columns',
    requiredAttributes: ['diameter_mm', 'length_m', 'origin', 'grade'],
    knownAttributes: { diameter_mm: '12', length_m: '12m', origin: 'local', grade: 'grade60' },
    missingAttributes: [],
    clarificationQuestions: [],
    originalUnit: 'length_12m',
    preferredComparisonUnit: 'length_12m',
    possibleConversions: [
      { fromUnit: 'length_12m', toUnit: 'tonne', factorSource: 'manufacturer_spec' },
    ],
    prohibitedConversions: ['length_12m→sqm'],
    inclusionQuestions: ['delivery', 'loading_offloading'],
    deliveryRequired: true,
    installationRequired: false,
    condition: 'new',
    location: 'ng-lagos-ikeja',
    riskFlags: [],
    evidenceProvided: [],
    minimumResearchReadiness: 0.6,
    researchReady: true,
    confidence: 0.9,
    uncertaintyReasons: [],
    escalationRecommended: false,
    generatedByModel: 'test-model',
    generatedAt: '2026-07-28T18:00:00Z',
    schemaVersion: MATRIX_SCHEMA_VERSION,
    ...overrides,
  };
}

describe('temporary matrix validation', () => {
  it('accepts a fully valid structured matrix', () => {
    const result = validateTemporaryMatrix(validMatrix());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('rejects malformed model responses (non-object, junk)', () => {
    expect(validateTemporaryMatrix('not json').valid).toBe(false);
    expect(validateTemporaryMatrix(null).valid).toBe(false);
    expect(validateTemporaryMatrix([1, 2]).valid).toBe(false);
  });

  it('reports every missing required field', () => {
    const broken = validMatrix() as unknown as Record<string, unknown>;
    delete broken.requestId;
    delete broken.generatedByModel;
    broken.confidence = 7;
    const result = validateTemporaryMatrix(broken);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'requestId missing or empty',
        'generatedByModel missing or empty',
        'confidence must be 0..1',
      ]),
    );
  });

  it('rejects an unknown matchedFamilyId', () => {
    const result = validateTemporaryMatrix(validMatrix({ matchedFamilyId: 'flying-cars' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('not a known family');
  });

  it('rejects wrong schema versions', () => {
    const result = validateTemporaryMatrix(validMatrix({ schemaVersion: 99 }));
    expect(result.valid).toBe(false);
  });

  it('validates clarification-question structure strictly', () => {
    const result = validateTemporaryMatrix(
      validMatrix({
        clarificationQuestions: [
          {
            id: 'q1',
            question: 'Which rod diameter do you need?',
            plainLanguageExplanation: 'Rod thickness in millimetres; it is written on your structural drawing.',
            attributeKey: 'diameter_mm',
            questionType: 'single_select',
            required: true,
            reasonItAffectsPrice: 'Price scales directly with diameter.',
            options: ['8mm', '12mm', '16mm'],
            allowsUnknown: true,
            allowsUpload: true,
            displayOrder: 1,
          },
        ],
      }),
    );
    expect(result.valid).toBe(true);

    const bad = validateTemporaryMatrix(
      validMatrix({
        clarificationQuestions: [{ id: 'q1', questionType: 'teleport' } as never],
      }),
    );
    expect(bad.valid).toBe(false);
    expect(bad.errors.join(' ')).toContain('questionType invalid');
  });
});

describe('AI-supplied conversion factors are rejected', () => {
  it('refuses conversions with no registered rule', () => {
    const errors = validateProposedConversions([
      { fromUnit: 'bag_50kg', toUnit: 'sqm', factorSource: 'product_spec', factorValue: 3 },
    ]);
    expect(errors.join(' ')).toContain('AI may not invent conversions');
  });

  it('refuses a wrong factor source on a registered rule', () => {
    const errors = validateProposedConversions([
      { fromUnit: 'carton', toUnit: 'sqm', factorSource: 'seller_stated' },
    ]);
    expect(errors.join(' ')).toContain("factorSource must be 'product_spec'");
  });

  it('refuses AI overriding a fixed physical factor', () => {
    const errors = validateProposedConversions([
      { fromUnit: 'tonne', toUnit: 'kg', factorSource: 'fixed', factorValue: 900 },
    ]);
    expect(errors.join(' ')).toContain('AI-supplied value rejected');
  });

  it('accepts registered conversions with correct sources', () => {
    const errors = validateProposedConversions([
      { fromUnit: 'carton', toUnit: 'sqm', factorSource: 'product_spec' },
      { fromUnit: 'tonne', toUnit: 'kg', factorSource: 'fixed', factorValue: 1000 },
    ]);
    expect(errors).toEqual([]);
  });
});

describe('catalogue-family matrix enrichment', () => {
  it('injects price-changing attributes and normalized unit from the family template', () => {
    const enriched = enrichMatrixFromFamily(
      validMatrix({
        matchedFamilyId: 'cement',
        requiredAttributes: [],
        knownAttributes: { brand: 'Dangote' },
        preferredComparisonUnit: null,
      }),
    );
    expect(enriched.requiredAttributes).toEqual(expect.arrayContaining(['brand', 'grade', 'bag_weight', 'purchase_type']));
    expect(enriched.missingAttributes).toEqual(expect.arrayContaining(['grade', 'purchase_type']));
    expect(enriched.missingAttributes).not.toContain('brand');
    expect(enriched.preferredComparisonUnit).toBe('bag_50kg');
  });

  it('passes custom (unmatched) matrices through unchanged', () => {
    const custom = validMatrix({ matchedFamilyId: null, preferredComparisonUnit: 'piece' });
    expect(enrichMatrixFromFamily(custom)).toEqual(custom);
  });
});

describe('research-readiness and confidence states', () => {
  it('high confidence with complete spec is research-ready', () => {
    const decision = decideReadiness(validMatrix({ confidence: 0.9 }));
    expect(decision.state).toBe('research_ready_high_confidence');
    expect(decision.mayProceed).toBe(true);
  });

  it('moderate confidence still proceeds with the moderate state', () => {
    const decision = decideReadiness(validMatrix({ confidence: 0.65 }));
    expect(decision.state).toBe('research_ready_moderate_confidence');
    expect(decision.mayProceed).toBe(true);
  });

  it('missing required answers block research with clarification_required', () => {
    const decision = decideReadiness(
      validMatrix({
        confidence: 0.7,
        missingAttributes: ['diameter_mm'],
        clarificationQuestions: [
          {
            id: 'q1', question: 'Which rod diameter?', plainLanguageExplanation: 'Thickness in mm.',
            attributeKey: 'diameter_mm', questionType: 'single_select', required: true,
            reasonItAffectsPrice: 'Diameter drives price.', allowsUnknown: true, allowsUpload: true, displayOrder: 1,
          },
        ],
      }),
    );
    expect(decision.state).toBe('clarification_required');
    expect(decision.mayProceed).toBe(false);
  });

  it('low confidence without evidence requires evidence, never silently proceeds', () => {
    const decision = decideReadiness(validMatrix({ confidence: 0.4, evidenceProvided: [] }));
    expect(decision.state).toBe('evidence_required');
    expect(decision.mayProceed).toBe(false);
  });

  it('"I don\'t know" everywhere with no evidence → insufficient_specification', () => {
    const decision = decideReadiness(
      validMatrix({
        confidence: 0.2,
        knownAttributes: {},
        missingAttributes: ['diameter_mm'],
        evidenceProvided: [],
        clarificationQuestions: [
          {
            id: 'q1', question: 'Which rod diameter?', plainLanguageExplanation: 'Thickness in mm.',
            attributeKey: 'diameter_mm', questionType: 'single_select', required: true,
            reasonItAffectsPrice: 'Diameter drives price.', allowsUnknown: true, allowsUpload: true, displayOrder: 1,
          },
        ],
      }),
    );
    expect(decision.state).toBe('insufficient_specification');
    expect(decision.mayProceed).toBe(false);
  });

  it('unidentifiable products are unsupported', () => {
    const decision = decideReadiness(
      validMatrix({ matchedFamilyId: null, productType: 'unknown', confidence: 0.1 }),
    );
    expect(decision.state).toBe('unsupported_product');
    expect(decision.mayProceed).toBe(false);
  });

  it('escalation is optional: research proceeds while a specialist look is offered', () => {
    const decision = decideReadiness(validMatrix({ confidence: 0.85, escalationRecommended: true }));
    expect(decision.state).toBe('optional_specialist_escalation');
    expect(decision.mayProceed).toBe(true);
  });
});

describe('optional escalation policy', () => {
  it('recommends escalation for the founder-listed exceptional cases', () => {
    const assessment = assessEscalation({ structuralOrSafetySensitive: true, userRequestedHumanVerification: true });
    expect(assessment.recommended).toBe(true);
    expect(assessment.reasons).toHaveLength(2);
    expect(assessment.required).toBe(false);
  });

  it('ordinary searches trigger no escalation and never require human review', () => {
    const assessment = assessEscalation({});
    expect(assessment.recommended).toBe(false);
    expect(assessment.required).toBe(false);
    expect(isHumanReviewRequired()).toBe(false);
  });

  it('safety-sensitive families carry the informational disclaimer, not a review gate', () => {
    expect(SAFETY_SENSITIVE_FAMILIES).toContain('reinforcement-steel');
    expect(SAFETY_DISCLAIMER).toContain('Price research only');
  });
});

describe('no automatic permanent-family publication (unchanged by AI matrices)', () => {
  it('temporary matrices cannot publish a family without admin approval', () => {
    expect(canPublishPromotedFamily({ proposalExists: true, adminApproved: false })).toBe(false);
    expect(canPublishPromotedFamily({ proposalExists: true, adminApproved: true, approvedByAdminId: 'admin-9' })).toBe(true);
  });
});

describe('source traceability', () => {
  it('validation fails when model/timestamp provenance is stripped', () => {
    const anonymous = validMatrix() as unknown as Record<string, unknown>;
    anonymous.generatedByModel = '';
    anonymous.generatedAt = '';
    const result = validateTemporaryMatrix(anonymous);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining(['generatedByModel missing or empty', 'generatedAt missing or empty']),
    );
  });
});

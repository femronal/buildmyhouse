import { canPublishPromotedFamily, qualifiesForPromotionProposal, routeCustomRequest } from './custom-research';
import { redactSensitiveFields, SENSITIVE_EVIDENCE_FIELDS } from './evidence';
import { EXPANSION_FAMILIES } from './expansion.data';
import { LEVEL1_FAMILIES } from './families';
import { matchLocation } from './locations';
import { FAMILY_PRIORITIES } from './priority.data';
import { matrixReviewStatus, reviewerQualifiesForFamily } from './review';
import { SERVICE_FAMILIES } from './services.data';
import { ProfessionalReviewRecord } from './types';
import { getUnit } from './units';

describe('taxonomy integrity', () => {
  it('defines exactly 25 Level 1 families with unique keys', () => {
    expect(LEVEL1_FAMILIES).toHaveLength(25);
    expect(new Set(LEVEL1_FAMILIES.map((f) => f.key)).size).toBe(25);
  });

  it('every family uses only registered canonical units', () => {
    for (const family of LEVEL1_FAMILIES) {
      for (const unit of family.sellerUnits) {
        expect(getUnit(unit)).toBeDefined();
      }
      expect(getUnit(family.normalizedUnit)).toBeDefined();
    }
  });

  it('every conditional question depends on an existing question', () => {
    for (const family of LEVEL1_FAMILIES) {
      const ids = new Set(family.questions.map((q) => q.id));
      for (const question of family.questions) {
        if (question.requirement === 'conditional') {
          expect(question.dependsOn).toBeDefined();
          if (question.dependsOn) {
            expect(ids.has(question.dependsOn.questionId)).toBe(true);
          }
        }
      }
    }
  });

  it('every family names an optional-escalation discipline and rationale', () => {
    for (const family of LEVEL1_FAMILIES) {
      expect(family.reviewers.primary).toBeTruthy();
      expect(family.reviewers.reason.length).toBeGreaterThan(10);
    }
  });

  it('all seed samples are unmistakably illustrative-only', () => {
    for (const family of LEVEL1_FAMILIES) {
      expect(family.samples.length).toBeGreaterThanOrEqual(2);
      for (const sample of family.samples) {
        expect(sample.illustrativeOnly).toBe(true);
        expect(sample.note).toContain('ILLUSTRATIVE ONLY');
      }
    }
  });

  it('quotation-bundle structures exist where bundles are common', () => {
    const bundleFamilies = ['inverters', 'batteries', 'cctv-security'];
    for (const key of bundleFamilies) {
      const family = LEVEL1_FAMILIES.find((f) => f.key === key);
      expect(family).toBeDefined();
      expect(family?.attributes.some((a) => a.key === 'bundle_state')).toBe(true);
      expect(family?.matching.neverComparableAcross).toContain('bundle_state');
    }
  });

  it('service families are disjoint from product families and carry scope factors', () => {
    const productKeys = new Set(LEVEL1_FAMILIES.map((f) => f.key));
    for (const service of SERVICE_FAMILIES) {
      expect(productKeys.has(service.key)).toBe(false);
      expect(service.scopeFactors).toContain('labour_only_vs_labour_and_material');
      expect(service.pricingUnits.every((u) => getUnit(u) !== undefined)).toBe(true);
    }
    expect(SERVICE_FAMILIES.length).toBeGreaterThanOrEqual(20);
  });

  it('every Level 1 and expansion family has commercial-priority scores of 1–5', () => {
    const scoredKeys = new Set(FAMILY_PRIORITIES.map((p) => p.key));
    for (const family of LEVEL1_FAMILIES) expect(scoredKeys.has(family.key)).toBe(true);
    for (const family of EXPANSION_FAMILIES) expect(scoredKeys.has(family.key)).toBe(true);
    for (const priority of FAMILY_PRIORITIES) {
      for (const value of Object.values(priority.scores)) {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('custom research routing', () => {
  it('routes catalogue-matched requests confidently', () => {
    const routing = routeCustomRequest({ productName: 'iron rod' });
    expect(routing.outcome).toBe('matched_confident');
    expect(routing.matchedFamilyKey).toBe('reinforcement-steel');
  });

  it('creates a temporary research item for unsupported but well-specified products', () => {
    const routing = routeCustomRequest({
      productName: 'swimming pool heat pump',
      description: 'Heat pump for a 40,000 litre outdoor pool in Lekki',
      knownBrand: 'Hayward',
    });
    expect(routing.outcome).toBe('temporary_research_item');
  });

  it('marks vague unsupported requests as insufficiently specified', () => {
    const routing = routeCustomRequest({ productName: 'machine' });
    expect(routing.outcome).toBe('insufficiently_specified');
  });
});

describe('custom-product promotion requires admin approval', () => {
  it('qualifies repeated paid-intent demand for a proposal', () => {
    expect(
      qualifiesForPromotionProposal(
        { normalizedQuery: 'pool heat pump', distinctRequestCount: 3, paidIntentCount: 2, firstSeen: '2026-07-01', latestSeen: '2026-07-25' },
        new Date('2026-07-28'),
      ),
    ).toBe(true);
  });

  it('never publishes without an admin approver', () => {
    expect(canPublishPromotedFamily({ proposalExists: true, adminApproved: true })).toBe(false);
    expect(canPublishPromotedFamily({ proposalExists: true, adminApproved: false, approvedByAdminId: 'admin-1' })).toBe(false);
    expect(canPublishPromotedFamily({ proposalExists: true, adminApproved: true, approvedByAdminId: 'admin-1' })).toBe(true);
  });
});

describe('professional-review version status', () => {
  const baseRecord: ProfessionalReviewRecord = {
    matrixKey: 'cement',
    matrixVersion: 1,
    category: 'structural',
    reviewerName: 'Engr. A. Example',
    reviewerProfession: 'structural_engineer',
    relevantQualification: 'COREN-registered civil engineer',
    reviewScope: 'Grades, bag weights, comparison gating',
    reviewDate: '2026-08-01',
    outcome: 'approved',
    notes: 'ok',
    adminApprover: 'admin-1',
  };

  it('is not reviewed with no complete records', () => {
    expect(matrixReviewStatus(1, [])).toBe('not_reviewed');
    expect(matrixReviewStatus(1, [{ ...baseRecord, adminApprover: '' }])).toBe('not_reviewed');
  });

  it('a name alone does not make a matrix reviewed', () => {
    expect(matrixReviewStatus(1, [{ ...baseRecord, relevantQualification: '', reviewScope: '' }])).toBe('not_reviewed');
  });

  it('review of an older version is outdated after a version bump', () => {
    expect(matrixReviewStatus(2, [baseRecord])).toBe('review_outdated');
  });

  it('changes_requested blocks reviewed status', () => {
    expect(matrixReviewStatus(1, [{ ...baseRecord, outcome: 'changes_requested' }])).toBe('changes_requested');
  });

  it('approves only complete, current-version records', () => {
    expect(matrixReviewStatus(1, [baseRecord])).toBe('professionally_reviewed');
  });

  it('rejects reviewers whose profession does not match the family assignment', () => {
    expect(reviewerQualifiesForFamily('security_low_voltage', { primary: 'structural_engineer', secondary: 'quantity_surveyor' })).toBe(false);
    expect(reviewerQualifiesForFamily('quantity_surveyor', { primary: 'structural_engineer', secondary: 'quantity_surveyor' })).toBe(true);
  });
});

describe('location fallback rules', () => {
  it('exact local area is level 1', () => {
    expect(matchLocation('ng-lagos-ikeja', 'ng-lagos-ikeja').level).toBe('exact_local_area');
  });

  it('same city applies for areas under one city', () => {
    expect(matchLocation('ng-lagos-ikeja', 'ng-lagos-yaba').level).toBe('same_city');
  });

  it('same state substitution carries a notice', () => {
    const match = matchLocation('ng-lagos-ajah', 'mkt-orile-coker');
    expect(match.level).toBe('same_state');
    expect(match.substitutionNotice).toBeTruthy();
  });

  it('nearby state applies for Lagos↔Ogun', () => {
    const match = matchLocation('ng-lagos-ikeja', 'ng-ogun-sango-otta');
    expect(match.level).toBe('nearby_state');
    expect(match.substitutionNotice).toContain('nearby');
  });

  it('national sellers apply only when they deliver nationally', () => {
    expect(matchLocation('ng-edo-benin', 'ng-kano', true).level).toBe('national');
    expect(matchLocation('ng-edo-benin', 'ng-kano', false).level).toBe('insufficient');
  });
});

describe('sensitive evidence fields remain private', () => {
  it('redacts every sensitive field, including nested ones', () => {
    const extracted = {
      supplier: 'ABC Building Materials',
      phoneNumber: '0803 000 0000',
      lines: [{ description: 'Dangote cement', qty: 100, customerName: 'Mrs Private Person' }],
      payment: { bankDetails: '0123456789 GTB' },
    };
    const redacted = redactSensitiveFields(extracted) as Record<string, unknown>;
    expect(redacted.phoneNumber).toBe('[REDACTED]');
    expect((redacted.lines as Record<string, unknown>[])[0].customerName).toBe('[REDACTED]');
    expect((redacted.payment as Record<string, unknown>).bankDetails).toBe('[REDACTED]');
    expect(redacted.supplier).toBe('ABC Building Materials');
  });

  it('covers the full sensitive-field policy list', () => {
    expect(SENSITIVE_EVIDENCE_FIELDS).toEqual(
      expect.arrayContaining(['customerName', 'phoneNumber', 'homeAddress', 'bankDetails', 'cardDetails', 'signature']),
    );
  });
});

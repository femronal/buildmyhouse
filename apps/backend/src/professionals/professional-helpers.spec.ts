import {
  ProfessionalCredentialStatus,
  ProfessionalCredentialVerification,
  ProfessionalListingStatus,
  ProfessionalOwnershipStatus,
  ProfessionalType,
  ProfessionalVerificationStatus,
} from '@prisma/client';
import {
  aggregateVerification,
  assertNoForbiddenPublicKeys,
  computeCompleteness,
  computeSearchRank,
  credentialCurrencyStatus,
  isPubliclyListed,
  normalizeEmail,
  normalizePhone,
  normalizeProfessionalSlug,
  normalizeRegKey,
  toPublicProfessionalCard,
  toPublicProfessionalProfile,
} from './professional-helpers';

describe('professional-helpers', () => {
  it('normalizes slug, phone, email and registration keys', () => {
    expect(normalizeProfessionalSlug('Engr. Adewale Johnson')).toBe('engr-adewale-johnson');
    expect(normalizePhone('+234 801 234 5678')).toBe('2348012345678');
    expect(normalizeEmail('Ada@Example.COM')).toBe('ada@example.com');
    expect(normalizeRegKey('coren', 'R. 12,345')).toBe('coren:R12345');
  });

  it('only treats listed profiles as public', () => {
    expect(isPubliclyListed(ProfessionalListingStatus.listed)).toBe(true);
    expect(isPubliclyListed(ProfessionalListingStatus.draft)).toBe(false);
    expect(isPubliclyListed(ProfessionalListingStatus.hidden)).toBe(false);
    expect(isPubliclyListed(ProfessionalListingStatus.archived)).toBe(false);
  });

  it('computes completeness without treating it as verification', () => {
    const empty = computeCompleteness({});
    const full = computeCompleteness({
      displayName: 'QS House',
      professionalType: ProfessionalType.firm,
      primaryProfessionId: 'profession_quantity_surveyor',
      phone: '0801',
      email: 'a@b.com',
      website: 'https://qs.ng',
      city: 'Lagos',
      state: 'Lagos',
      serviceStatesCount: 2,
      specialtiesCount: 1,
      servicesCount: 1,
      deliverablesCount: 1,
      stagesCount: 1,
      bio: 'Independent quantity surveying practice with stage valuation and variation review.',
      yearsExperience: 12,
      credentialsCount: 1,
      siteVisits: true,
    });
    expect(empty).toBe(0);
    expect(full).toBe(100);
  });

  it('ranks used-by-BMH and credential-checked above completeness', () => {
    const used = computeSearchRank({ usedByBmh: true, completenessScore: 10 });
    const checked = computeSearchRank({
      verificationStatus: ProfessionalVerificationStatus.verified,
      completenessScore: 90,
    });
    expect(used).toBeGreaterThan(checked);
  });

  it('aggregates credential verification and expiry', () => {
    expect(aggregateVerification([])).toBe(ProfessionalVerificationStatus.unverified);
    expect(
      aggregateVerification([
        {
          isPrimary: true,
          verificationStatus: ProfessionalCredentialVerification.checked,
          credentialStatus: ProfessionalCredentialStatus.current,
          expiresAt: new Date(Date.now() + 86400000 * 200),
        },
      ]),
    ).toBe(ProfessionalVerificationStatus.verified);
    expect(
      aggregateVerification([
        {
          isPrimary: true,
          verificationStatus: ProfessionalCredentialVerification.checked,
          credentialStatus: ProfessionalCredentialStatus.expired,
          expiresAt: new Date('2020-01-01'),
        },
      ]),
    ).toBe(ProfessionalVerificationStatus.expired);
    expect(credentialCurrencyStatus(new Date('2019-01-01'))).toBe(ProfessionalCredentialStatus.expired);
  });

  it('public DTO hides private contact, notes, fees and document keys', () => {
    const listing: any = {
      id: 'p1',
      slug: 'adewale-johnson-structural-engineer',
      displayName: 'Engr. Adewale Johnson',
      professionalType: ProfessionalType.individual,
      listingStatus: ProfessionalListingStatus.listed,
      ownershipStatus: ProfessionalOwnershipStatus.claimed,
      verificationStatus: ProfessionalVerificationStatus.verified,
      usedByBmh: true,
      usedByBmhNote: 'secret fee history',
      phone: '08011111111',
      email: 'private@example.com',
      whatsapp: '08011111111',
      website: 'https://adewale.ng',
      publicPhone: false,
      publicEmail: false,
      publicWhatsapp: false,
      publicWebsite: true,
      city: 'Lekki',
      state: 'Lagos',
      serviceStates: ['Lagos', 'Ogun'],
      remoteConsultation: true,
      siteVisits: true,
      canIssueSignedReport: true,
      yearsExperience: 14,
      completenessScore: 80,
      bio: 'Independent structural engineer.',
      sourceNotes: 'researched from LinkedIn',
      sourceUrls: ['https://internal.example'],
      updatedAt: new Date('2026-09-14'),
      primaryProfession: { key: 'structural-engineer', label: 'Structural Engineer' },
      specialties: [{ specialty: { key: 'reinforced-concrete', label: 'Reinforced Concrete' } }],
      services: [{ service: { key: 'review-foundation', label: 'Review foundation' } }],
      deliverables: [{ deliverable: { key: 'inspection-report', label: 'Inspection report' } }],
      projectStages: [{ projectStage: { key: 'foundation', label: 'Foundation' } }],
      credentials: [
        {
          isPublic: true,
          isPrimary: true,
          verificationStatus: ProfessionalCredentialVerification.checked,
          regulatorLabel: 'COREN',
          registrationNumber: 'R12345',
          verifiedAt: new Date('2026-09-14'),
          expiresAt: new Date('2028-01-01'),
          verificationNotes: 'internal reviewer comment',
          documents: [{ fileRef: 's3-private-key' }],
        },
      ],
      procurement: { inspectionFee: 100000, internalNotes: 'do not expose' },
    };

    const card = toPublicProfessionalCard(listing);
    const profile = toPublicProfessionalProfile(listing);
    expect(card.trust.credentialLabel).toBe('COREN credential checked');
    expect(card.trust.usedByBmhLabel).toBe('Used by BuildMyHouse');
    expect(card.trust.claimedLabel).toBe('Claimed');
    expect(profile.contact.phone).toBeNull();
    expect(profile.contact.email).toBeNull();
    expect(profile.website).toBe('https://adewale.ng');
    expect(assertNoForbiddenPublicKeys(card)).toEqual([]);
    expect(assertNoForbiddenPublicKeys(profile)).toEqual([]);
  });
});

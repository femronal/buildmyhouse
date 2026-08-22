import {
  VendorListingStatus,
  VendorVerificationCheckStatus,
  VendorVerificationStatus,
} from '@prisma/client';
import {
  computeProfileCompleteness,
  isPubliclyListed,
  normalizeEmail,
  normalizePhone,
  normalizeTradingName,
  normalizeVendorSlug,
  toPublicVendorCard,
  toPublicVendorProfile,
} from './vendor-helpers';

describe('vendor-helpers', () => {
  it('normalizes slugs', () => {
    expect(normalizeVendorSlug('  Dangote Cement — Lagos!! ')).toBe('dangote-cement-lagos');
  });

  it('normalizes phones and emails', () => {
    expect(normalizePhone('+234 801 234 5678')).toBe('2348012345678');
    expect(normalizeEmail(' Vendor@Example.COM ')).toBe('vendor@example.com');
    expect(normalizeTradingName('Acme  Building!!')).toBe('acme building');
  });

  it('computes completeness without treating it as verification', () => {
    const score = computeProfileCompleteness({
      tradingName: 'Acme',
      description: 'A'.repeat(50),
      publicPhone: '08012345678',
      stateLabel: 'Lagos',
      businessTypes: ['retailer'],
      offeringsCount: 2,
      brandsCount: 3,
    });
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThan(100);
  });

  it('only treats listed as public', () => {
    expect(isPubliclyListed(VendorListingStatus.listed)).toBe(true);
    expect(isPubliclyListed(VendorListingStatus.internal_only)).toBe(false);
    expect(isPubliclyListed(VendorListingStatus.submitted)).toBe(false);
    expect(isPubliclyListed(VendorListingStatus.suspended)).toBe(false);
  });

  it('maps public profile without private fields', () => {
    const profile: any = {
      id: 'v1',
      slug: 'acme-supplies',
      tradingName: 'Acme Supplies',
      logoUrl: null,
      description: 'Building materials',
      listingStatus: VendorListingStatus.listed,
      verificationStatus: VendorVerificationStatus.unverified,
      businessTypes: ['retailer'],
      stateLabel: 'Lagos',
      cityLabel: 'Ikeja',
      yearEstablished: 2018,
      profileCompleteness: 72,
      websiteUrl: 'https://example.com',
      socialLinks: null,
      preferredContactMethod: 'whatsapp',
      businessHours: 'Mon-Sat',
      publicPhone: '08011112222',
      publicWhatsApp: '08011112222',
      publicEmail: 'hidden@example.com',
      showPublicPhone: true,
      showPublicWhatsApp: true,
      showPublicEmail: false,
      privateBusinessAddress: '12 Secret Street',
      cacNumber: 'RC123',
      nationwideDelivery: false,
      pickupAvailable: true,
      interstateDelivery: true,
      installationAvailable: false,
      acceptsProjectQuotations: true,
      acceptsBulkOrders: true,
      paymentMethodsAccepted: ['transfer'],
      pricesNegotiable: true,
      priceListAvailable: false,
      typicalQuoteResponseHours: 24,
      previouslyUsedByBmh: false,
      updatedAt: new Date('2026-01-01'),
      offerings: [
        {
          familyKey: 'cement',
          categoryCode: 'structural',
          customCategoryLabel: null,
          productTypes: ['OPC'],
          brands: ['Dangote'],
          sellsRetail: true,
          sellsWholesale: true,
          normalUnit: '50kg bag',
          minimumOrderQuantity: 100,
          minimumOrderUnit: 'bags',
          stockedNormally: true,
          specialOrder: false,
          deliveryAvailable: true,
          installationAvailable: false,
          acceptsQuotations: true,
          pricesNegotiable: true,
          examplePriceAmount: 9500,
          examplePriceUnit: 'bag',
          examplePriceNotes: null,
        },
      ],
      serviceAreas: [
        {
          locationKey: 'ng-lagos',
          stateKey: 'ng-lagos',
          stateLabel: 'Lagos',
          cityKey: null,
          cityLabel: null,
          coverageType: 'delivery',
        },
      ],
      representatives: [
        {
          name: 'Chinedu Okafor',
          role: 'MD',
          showPublicly: false,
          phone: '08099998888',
          email: 'private@example.com',
        },
      ],
      verificationChecks: [
        {
          checkKey: 'business_identity',
          status: VendorVerificationCheckStatus.passed,
        },
      ],
    };

    const card = toPublicVendorCard(profile);
    expect(card.isBuildMyHouseVerified).toBe(false);
    expect(card.brands).toContain('Dangote');
    expect(card.categories).toContain('cement');

    const publicProfile = toPublicVendorProfile(profile);
    expect(publicProfile.publicEmail).toBeNull();
    expect(publicProfile.publicPhone).toBe('08011112222');
    expect(publicProfile.representative).toBeNull();
    expect((publicProfile as any).privateBusinessAddress).toBeUndefined();
    expect((publicProfile as any).cacNumber).toBeUndefined();
    expect(publicProfile.offerings[0].examplePriceDisclaimer).toMatch(/not a BuildMyHouse market estimate/i);
    expect(publicProfile.transparency.verificationLabel).toMatch(/not BuildMyHouse Verified/i);
  });

  it('shows public representative only when opted in', () => {
    const profile: any = {
      id: 'v1',
      slug: 'acme',
      tradingName: 'Acme',
      logoUrl: null,
      description: null,
      listingStatus: VendorListingStatus.listed,
      verificationStatus: VendorVerificationStatus.verified,
      businessTypes: [],
      stateLabel: null,
      cityLabel: null,
      yearEstablished: null,
      profileCompleteness: 10,
      websiteUrl: null,
      socialLinks: null,
      preferredContactMethod: null,
      businessHours: null,
      publicPhone: null,
      publicWhatsApp: null,
      publicEmail: null,
      showPublicPhone: true,
      showPublicWhatsApp: true,
      showPublicEmail: false,
      nationwideDelivery: false,
      pickupAvailable: true,
      interstateDelivery: false,
      installationAvailable: false,
      acceptsProjectQuotations: true,
      acceptsBulkOrders: true,
      paymentMethodsAccepted: [],
      pricesNegotiable: true,
      priceListAvailable: false,
      typicalQuoteResponseHours: null,
      previouslyUsedByBmh: true,
      updatedAt: new Date(),
      offerings: [],
      serviceAreas: [],
      representatives: [{ name: 'Ada', role: 'Owner', showPublicly: true }],
      verificationChecks: [],
    };
    const publicProfile = toPublicVendorProfile(profile);
    expect(publicProfile.isBuildMyHouseVerified).toBe(true);
    expect(publicProfile.representative).toEqual({ name: 'Ada', role: 'Owner' });
    expect(publicProfile.transparency.bmhRelationship).toMatch(/Previously supplied/);
  });
});

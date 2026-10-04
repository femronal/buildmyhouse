import { toPublicArtisanCard, toPublicArtisanProfile, assertNoArtisanPrivateKeys } from './artisan-public';

describe('public artisan serializer', () => {
  it('hides recruitment, notes and private contact', () => {
    const profile = toPublicArtisanProfile({
      id: 'a1',
      slug: 'opeyemi-plumbing',
      displayName: 'Opeyemiade Plumbing Services',
      businessName: 'Opeyemiade Plumbing Services',
      bio: 'Pipe repairs.',
      phone: '08030000000',
      email: 'private@example.com',
      whatsapp: '08030000000',
      website: 'https://example.com',
      publicPhone: true,
      publicEmail: false,
      publicWhatsapp: false,
      publicWebsite: true,
      city: 'Mowe',
      state: 'Ogun',
      country: 'Nigeria',
      serviceStates: ['Ogun'],
      serviceCities: ['Mowe'],
      listingStatus: 'listed',
      claimStatus: 'unclaimed',
      verificationStatus: 'unverified',
      usedByBmh: false,
      trustScore: 28,
      updatedAt: new Date('2026-09-30'),
      primaryTrade: { key: 'plumber', label: 'Plumber' },
      capabilities: [],
      media: [],
      checks: [],
      recruitmentStatus: 'discovered',
      internalNotes: 'call after 6',
      sourceNotes: 'google maps',
    });
    expect(profile.contact.phone).toBe('08030000000');
    expect(profile.contact.email).toBeNull();
    expect(profile.trustScore).toBe(28);
    expect(profile.listingStatus).toBe('listed');
    expect(profile.verificationStatus).toBe('unverified');
    expect(assertNoArtisanPrivateKeys(profile)).toEqual([]);
    expect(JSON.stringify(profile)).not.toContain('discovered');
    expect(JSON.stringify(profile)).not.toContain('aggregateRating');
  });

  it('shows the trade problems when the listing was not tagged with any', () => {
    const card = toPublicArtisanCard({
      id: 'a2',
      slug: 'z-and-j',
      displayName: 'Z And J Heavy Duty Diesel Generator Mechanic',
      publicPhone: false,
      publicEmail: false,
      publicWhatsapp: false,
      publicWebsite: false,
      serviceStates: [],
      serviceCities: [],
      listingStatus: 'listed',
      claimStatus: 'unclaimed',
      verificationStatus: 'unverified',
      usedByBmh: false,
      trustScore: 42,
      updatedAt: new Date('2026-10-01'),
      primaryTrade: {
        key: 'generator-technician',
        label: 'Generator Technician',
        capabilities: [{ id: 'p1', kind: 'problem', key: 'generator-not-starting', label: 'Generator not starting' }],
      },
      capabilities: [],
    });
    expect(card.problems).toEqual(['Generator not starting']);
  });
});

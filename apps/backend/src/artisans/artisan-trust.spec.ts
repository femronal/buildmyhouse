import { computeArtisanTrust } from './artisan-trust';

describe('computeArtisanTrust', () => {
  const empty = {
    hasTrade: false,
    serviceAreaCount: 0,
    hasLogo: false,
    hasWorkshopCover: false,
    galleryCount: 0,
    specialtyCount: 0,
    serviceCount: 0,
    problemCount: 0,
    claimed: false,
    verificationSubmitted: false,
    verificationCheckPassed: false,
    verificationApproved: false,
  };

  it('stays public-scoreable when information is thin', () => {
    const result = computeArtisanTrust({
      ...empty,
      displayName: 'Opeyemiade Plumbing Services',
      hasTrade: true,
      phone: '08030000000',
      state: 'Ogun',
      city: 'Mowe',
      serviceCount: 1,
    });
    expect(result.score).toBe(6 + 5 + 5 + 4 + 4 + 6);
    expect(result.score).toBeLessThan(50);
    expect(result.suggestions.find((item) => item.key === 'workshopCover')?.points).toBe(10);
    expect(result.suggestions.find((item) => item.key === 'logo')?.points).toBe(5);
  });

  it('reaches 100 only when every weighted item is present', () => {
    const result = computeArtisanTrust({
      displayName: 'Ade & Sons',
      hasTrade: true,
      bio: 'Aluminium windows, doors and glass replacement for homes in Agege.',
      phone: '0801',
      whatsapp: '0801',
      email: 'a@example.com',
      website: 'https://example.com',
      state: 'Lagos',
      city: 'Agege',
      address: '12 Workshop Road',
      serviceAreaCount: 2,
      hasLogo: true,
      hasWorkshopCover: true,
      galleryCount: 3,
      specialtyCount: 1,
      serviceCount: 2,
      problemCount: 1,
      claimed: true,
      verificationSubmitted: true,
      verificationCheckPassed: true,
      verificationApproved: true,
    });
    expect(result.score).toBe(100);
    expect(result.suggestions).toEqual([]);
  });

  it('gives partial gallery points', () => {
    const one = computeArtisanTrust({ ...empty, galleryCount: 1 });
    const two = computeArtisanTrust({ ...empty, galleryCount: 2 });
    expect(one.suggestions.find((item) => item.key === 'gallery')?.points).toBe(3);
    expect(two.suggestions.find((item) => item.key === 'gallery')?.points).toBe(2);
  });
});

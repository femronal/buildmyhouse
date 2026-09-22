import {
  directoryCanonical,
  formatResultCount,
  headingAvoidsVerifiedLead,
  humanizeKey,
  initialsFromName,
  normalizeSearchParams,
  pluralizeLastWord,
  professionalDirectoryHeading,
  PROFESSIONAL_DIRECTORY_BASE_TITLE,
  readFlag,
  readPage,
  readSort,
  toggleFilterHref,
  VENDOR_DIRECTORY_BASE_TITLE,
  VENDOR_QUERY_ORDER,
  vendorDirectoryHeading,
  withDirectoryParams,
} from './directory-listing';

describe('directory listing query helpers', () => {
  it('reads flags, pages, and sort without inventing values', () => {
    expect(readFlag('1')).toBe(true);
    expect(readFlag('true')).toBe(true);
    expect(readFlag(undefined)).toBe(false);
    expect(readPage('3')).toBe(3);
    expect(readPage('0')).toBe(1);
    expect(readPage('nope')).toBe(1);
    expect(readSort('name')).toBe('name');
    expect(readSort('best')).toBe('best');
    expect(readSort(undefined)).toBe('best');
  });

  it('normalizes expo search params', () => {
    expect(
      normalizeSearchParams({ category: ['cement'], state: '', q: ' dangote ' }, ['category', 'state', 'q']),
    ).toEqual({
      category: 'cement',
      state: undefined,
      q: ' dangote ',
    });
  });

  it('builds crawlable vendor filter URLs and resets page when the filter changes', () => {
    const current = { category: 'cement', page: '2', verified: '1' };
    expect(withDirectoryParams('/vendors', current, { state: 'ng-lagos' }, VENDOR_QUERY_ORDER)).toBe(
      '/vendors?category=cement&state=ng-lagos&verified=1',
    );
    expect(toggleFilterHref('/vendors', current, 'category', 'cement', VENDOR_QUERY_ORDER)).toBe(
      '/vendors?verified=1',
    );
    expect(withDirectoryParams('/vendors', current, { page: '3' }, VENDOR_QUERY_ORDER, false)).toBe(
      '/vendors?category=cement&verified=1&page=3',
    );
  });

  it('keeps canonicals on category, profession, state, and need', () => {
    expect(
      directoryCanonical(
        '/vendors',
        { q: 'dangote', category: 'cement', state: 'ng-lagos', verified: '1', page: '2' },
        ['category', 'state'],
      ),
    ).toBe('/vendors?category=cement&state=ng-lagos');
    expect(
      directoryCanonical('/professionals', { profession: 'architect', need: 'i-need-a-boq', q: 'lagos' }, [
        'profession',
        'need',
        'state',
      ]),
    ).toBe('/professionals?profession=architect&need=i-need-a-boq');
  });
});

describe('directory headings', () => {
  it('keeps the unfiltered titles and describes the active place or category', () => {
    expect(vendorDirectoryHeading({})).toBe(VENDOR_DIRECTORY_BASE_TITLE);
    expect(vendorDirectoryHeading({ categoryLabel: 'Cement', stateLabel: 'Lagos' })).toBe(
      'Cement Vendors in Lagos',
    );
    expect(vendorDirectoryHeading({ stateLabel: 'Abuja (FCT)' })).toBe(
      'Building Material Vendors in Abuja (FCT)',
    );
    expect(professionalDirectoryHeading({})).toBe(PROFESSIONAL_DIRECTORY_BASE_TITLE);
    expect(professionalDirectoryHeading({ professionLabel: 'Quantity Surveyor', stateLabel: 'Lagos' })).toBe(
      'Quantity Surveyors in Lagos',
    );
    expect(professionalDirectoryHeading({ needLabel: 'I need a BOQ' })).toBe('I need a BOQ in Nigeria');
    expect(professionalDirectoryHeading({ stateLabel: 'Rivers' })).toBe('Construction Professionals in Rivers');
  });

  it('does not lead titles with a verified-directory claim', () => {
    const headings = [
      vendorDirectoryHeading({}),
      vendorDirectoryHeading({ categoryLabel: 'Cement', stateLabel: 'Lagos' }),
      professionalDirectoryHeading({}),
      professionalDirectoryHeading({ professionLabel: 'Architect', stateLabel: 'Lagos' }),
      professionalDirectoryHeading({ needLabel: 'Survey my land', stateLabel: 'Ogun' }),
    ];
    headings.forEach((heading) => {
      expect(headingAvoidsVerifiedLead(heading)).toBe(true);
      expect(heading.toLowerCase().includes('verified')).toBe(false);
    });
  });

  it('pluralizes the last word of a profession label', () => {
    expect(pluralizeLastWord('Architect')).toBe('Architects');
    expect(pluralizeLastWord('Quantity Surveyor')).toBe('Quantity Surveyors');
    expect(pluralizeLastWord('Facilities Manager')).toBe('Facilities Managers');
    expect(humanizeKey('reinforcement-steel')).toBe('Reinforcement Steel');
    expect(initialsFromName('Tevis Bateman')).toBe('TB');
    expect(initialsFromName('Alina')).toBe('AL');
    expect(formatResultCount(1, 'vendor')).toBe('1 vendor');
    expect(formatResultCount(8108, 'professional')).toBe('8,108 professionals');
  });
});

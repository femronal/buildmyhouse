import { readFileSync } from 'fs';
import { join } from 'path';
import { VENDOR_CATEGORIES, categoryMatchSlugs, publicDeliverySummary } from './vendor-catalog';

function sharedCategorySlugs(): string[] {
  const source = readFileSync(
    join(__dirname, '../../../../packages/shared-types/src/vendor-catalog.ts'),
    'utf8',
  );
  return [...source.matchAll(/slug: '([^']+)'/g)].map((match) => match[1]);
}

describe('vendor catalog', () => {
  it('keeps the admin and public category lists identical', () => {
    expect(VENDOR_CATEGORIES.map((category) => category.slug)).toEqual(sharedCategorySlugs());
  });

  it('treats pop-ceilings as an alias of ceilings', () => {
    expect(categoryMatchSlugs('pop-ceilings')).toEqual(expect.arrayContaining(['ceilings', 'pop-ceilings']));
  });

  it('does not describe an empty delivery field as no delivery', () => {
    expect(publicDeliverySummary({ deliveryStatus: null, areaLabels: [] })).toBe('Delivery: not confirmed');
    expect(publicDeliverySummary({ deliveryStatus: 'not_confirmed', areaLabels: ['Lekki/Ajah'] })).toBe(
      'Delivery: not confirmed',
    );
    expect(publicDeliverySummary({ deliveryStatus: 'pickup_only', areaLabels: [] })).toBe('Pickup only');
    expect(publicDeliverySummary({ deliveryStatus: 'delivers', areaLabels: ['Lekki/Ajah'] })).toBe(
      'Delivers to: Lekki/Ajah',
    );
    expect(publicDeliverySummary({ deliveryStatus: 'delivers', areaLabels: [] })).toBe('Delivery: not confirmed');
  });
});

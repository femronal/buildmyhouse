import { VENDOR_CATEGORIES as sharedCategories, publicDeliverySummary } from '../../../../packages/shared-types/src/vendor-catalog';
import { VENDOR_CATEGORIES, categoryMatchSlugs, publicDeliverySummary as backendDelivery } from './vendor-catalog';

describe('vendor catalog', () => {
  it('keeps the admin and public category lists identical', () => {
    expect(VENDOR_CATEGORIES.map((category) => category.slug)).toEqual(
      sharedCategories.map((category) => category.slug),
    );
  });

  it('treats pop-ceilings as an alias of ceilings', () => {
    expect(categoryMatchSlugs('pop-ceilings')).toEqual(expect.arrayContaining(['ceilings', 'pop-ceilings']));
  });

  it('does not describe an empty delivery field as no delivery', () => {
    expect(publicDeliverySummary({ deliveryStatus: null, areaLabels: [] })).toBe('Delivery: not confirmed');
    expect(backendDelivery({ deliveryStatus: 'not_confirmed', areaLabels: ['Lekki/Ajah'] })).toBe(
      'Delivery: not confirmed',
    );
    expect(publicDeliverySummary({ deliveryStatus: 'pickup_only', areaLabels: [] })).toBe('Pickup only');
    expect(publicDeliverySummary({ deliveryStatus: 'delivers', areaLabels: ['Lekki/Ajah'] })).toBe(
      'Delivers to: Lekki/Ajah',
    );
    expect(publicDeliverySummary({ deliveryStatus: 'delivers', areaLabels: [] })).toBe('Delivery: not confirmed');
  });
});

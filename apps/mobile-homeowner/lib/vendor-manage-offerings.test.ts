import {
  emptyOfferingDraft,
  managedOfferingsForSave,
  offeringDraftFromProfile,
} from './vendor-manage-offerings';

describe('managed vendor offerings payload', () => {
  it('does not invent a category for a vendor with no offerings', () => {
    expect(offeringDraftFromProfile([]).familyKey).toBe('');
    expect(offeringDraftFromProfile(null).familyKey).toBe('');
    expect(managedOfferingsForSave(emptyOfferingDraft(), emptyOfferingDraft())).toBeUndefined();
  });

  it('sends exactly the category the owner picked', () => {
    const initial = emptyOfferingDraft();
    const current = { ...initial, familyKey: 'roofing-sheets', brands: 'Gerard' };
    expect(managedOfferingsForSave(initial, current)).toEqual([
      expect.objectContaining({ familyKey: 'roofing-sheets', brands: ['Gerard'] }),
    ]);
  });

  it('omits offerings when the owner did not change them', () => {
    const initial = offeringDraftFromProfile([
      { familyKey: 'doors', brands: ['Pearl'], sellsRetail: true, sellsWholesale: false, deliveryAvailable: true },
    ]);
    expect(managedOfferingsForSave(initial, { ...initial })).toBeUndefined();
  });
});

import { observationFingerprint } from '../observations/observations';
import { ADMIN_MANUAL_SOURCE_CODE, MERCHANT_WHATSAPP_SOURCE_CODE } from './observation-factory';

describe('observation-factory constants', () => {
  it('uses stable source codes for admin/merchant approvals', () => {
    expect(ADMIN_MANUAL_SOURCE_CODE).toBe('admin-manual');
    expect(MERCHANT_WHATSAPP_SOURCE_CODE).toBe('merchant-whatsapp');
  });

  it('fingerprints differ when price changes (corrections create new rows)', () => {
    const a = observationFingerprint({
      familyKey: 'cement',
      sourceCode: ADMIN_MANUAL_SOURCE_CODE,
      originalWording: 'Dangote 42.5',
      originalPrice: '10000',
      originalUnitCode: 'bag_50kg',
      listingDate: '2026-07-31',
    });
    const b = observationFingerprint({
      familyKey: 'cement',
      sourceCode: ADMIN_MANUAL_SOURCE_CODE,
      originalWording: 'Dangote 42.5',
      originalPrice: '11000',
      originalUnitCode: 'bag_50kg',
      listingDate: '2026-07-31',
    });
    expect(a).not.toBe(b);
  });
});

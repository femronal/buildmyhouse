import { BUILDMYHOUSE_CONTACT } from '@/lib/home-landing-content';

export const BUILDMYHOUSE_OPENING_HOURS = [
  {
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '18:00',
  },
  {
    dayOfWeek: ['Saturday'],
    opens: '09:00',
    closes: '14:00',
  },
] as const;

/** Directional contractor quote ranges (NGN). BuildMyHouse service fee is currently free. */
export const REPAIR_PRICING_GUIDE = [
  {
    service: 'Plumbing repair',
    slug: 'plumbing-repair-nigeria',
    lowNgn: 15000,
    highNgn: 120000,
    unit: 'per job',
    note: 'Simple fixes from ₦15k; major pipe work higher after scope photos.',
  },
  {
    service: 'Electrical repair',
    slug: 'electrical-repair-nigeria',
    lowNgn: 20000,
    highNgn: 150000,
    unit: 'per job',
    note: 'Tripping breakers and wiring faults vary by access and materials.',
  },
  {
    service: 'Roof leak repair',
    slug: 'roof-leak-repair-nigeria',
    lowNgn: 50000,
    highNgn: 350000,
    unit: 'per job',
    note: 'Inspection + materials + labour scoped before payment release.',
  },
  {
    service: 'Drainage repair',
    slug: 'drainage-repair-nigeria',
    lowNgn: 25000,
    highNgn: 180000,
    unit: 'per job',
    note: 'Blocked drains vs full drainage rework differ widely.',
  },
  {
    service: 'Window repair',
    slug: 'window-repair-nigeria',
    lowNgn: 20000,
    highNgn: 120000,
    unit: 'per job',
    note: 'Aluminium/window alignment jobs priced after on-site check.',
  },
] as const;

export const PLATFORM_SERVICE_FEE_OFFER = {
  name: 'BuildMyHouse repair coordination — service fee waived',
  price: 0,
  priceCurrency: 'NGN',
  description:
    'BuildMyHouse service fee for repair services is free for now. Homeowners pay the verified contractor quote only, in staged milestones with evidence.',
  url: 'https://buildmyhouse.app/book-repair',
} as const;

export const BOOK_REPAIR_TIME_SLOTS = [
  '08:00–10:00 WAT',
  '10:00–12:00 WAT',
  '12:00–14:00 WAT',
  '14:00–16:00 WAT',
  '16:00–18:00 WAT',
] as const;

export const AGENT_BUSINESS_HOURS_TEXT = BUILDMYHOUSE_OPENING_HOURS.map((slot) => {
  const days = slot.dayOfWeek.join(', ');
  return `${days}: ${slot.opens}–${slot.closes} WAT`;
}).join('; ');

export const AGENT_CONTACT_BLOCK = `Phone: ${BUILDMYHOUSE_CONTACT.phoneDisplay}
Address: ${BUILDMYHOUSE_CONTACT.address}
Online booking: https://buildmyhouse.app/book-repair
Pricing: https://buildmyhouse.app/pricing/repairs`;

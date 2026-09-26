import fs from 'node:fs';
import path from 'node:path';
import {
  HUB,
  START_PATHS,
  buildWhatsAppText,
  firstIncompleteStep,
  guardHref,
  normalizeWhatsApp,
  stepHref,
} from '@/lib/start-project/flow';

describe('start project flow', () => {
  it('writes the repair WhatsApp summary an agent can read', () => {
    const text = buildWhatsAppText(
      'repair',
      {
        type: 'plumbing',
        urgency: 'this-week',
        state: 'lagos',
        area: 'Lekki Phase 1',
        access: 'family',
        'visit-time': 'morning',
        'visit-day': 'tomorrow',
        note: 'Kitchen sink leaking under the cabinet',
      },
      { name: 'Ada Okafor' },
      'BMH-R-4821',
    );

    expect(text).toBe(
      [
        "Hello BuildMyHouse, I'd like to start a project.",
        '',
        'Type: Repair – Plumbing',
        'Urgency: This week',
        'Location: Lagos, Lekki Phase 1',
        'Access: Family or caretaker at the property',
        'Visit: Morning, Tomorrow',
        'Note: Kitchen sink leaking under the cabinet',
        'Name: Ada Okafor',
        'Ref: BMH-R-4821',
      ].join('\n'),
    );
  });

  it('omits the reference when the lead was not saved', () => {
    const text = buildWhatsAppText('interiors', { space: 'living', need: 'design' }, { name: 'Ada' }, null);
    expect(text).not.toContain('Ref:');
    expect(text).toContain('Type: Interior design – Living room');
  });

  it('sends a deep link back to the first unanswered step', () => {
    const path = START_PATHS.repair;
    expect(guardHref(path, 'contact', {}, { name: '', whatsapp: '' })).toBe('/start/repair');
    expect(firstIncompleteStep(path, { type: 'plumbing' }, { name: '', whatsapp: '' })?.id).toBe('urgency');
    expect(stepHref('repair', 'review', true)).toBe('/start/repair/review?from=review');
  });

  it('accepts a Nigerian WhatsApp number with or without a leading zero', () => {
    expect(normalizeWhatsApp('+234', '08012345678')).toBe('+2348012345678');
    expect(normalizeWhatsApp('+234', '8012345678')).toBe('+2348012345678');
    expect(normalizeWhatsApp('+44', '12')).toBeNull();
  });

  it('keeps the crawlable pages aligned with the questions', () => {
    const pages = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'indexable.json'), 'utf8'),
    ) as Record<string, { h1: string; intro: string; title: string; links: { title: string }[] }>;

    expect(pages['/start'].h1).toBe(HUB.question);
    expect(pages['/start'].intro).toBe(HUB.intro);
    expect(pages['/start'].links.map((link) => link.title)).toEqual(
      Object.values(START_PATHS).map((item) => item.title),
    );

    for (const pathId of ['repair', 'upgrade', 'build', 'interiors'] as const) {
      const page = pages[`/start/${pathId}`];
      const first = START_PATHS[pathId].steps[0];
      expect(page.h1).toBe(first.question);
      expect(page.intro).toBe(START_PATHS[pathId].intro);
      expect(page.title).toBe(START_PATHS[pathId].seoTitle);
      expect(page.links.map((link) => link.title)).toEqual((first.options || []).map((option) => option.title));
    }
  });
});

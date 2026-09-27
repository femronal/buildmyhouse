import fs from 'node:fs';
import path from 'node:path';
import {
  HUB,
  NOTE_MIN_LENGTH,
  START_PATHS,
  buildWhatsAppText,
  firstIncompleteStep,
  followUpDocumentTitle,
  guardHref,
  hrefAfterChoice,
  normalizeWhatsApp,
  noteIsRequired,
  progressFor,
  seoForPathname,
  stepHref,
} from '@/lib/start-project/flow';
import { START_DRAFT_TTL_MS, draftIsExpired } from '@/lib/start-project/store';

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

  it('stores WhatsApp numbers as E.164 and strips a leading trunk zero', () => {
    expect(normalizeWhatsApp('+234', '0803 123 4567')).toBe('+2348031234567');
    expect(normalizeWhatsApp('+234', '08012345678')).toBe('+2348012345678');
    expect(normalizeWhatsApp('+234', '8012345678')).toBe('+2348012345678');
    expect(normalizeWhatsApp('+44', '07911 123456')).toBe('+447911123456');
    expect(normalizeWhatsApp('+234', '+44 7911 123456')).toBe('+447911123456');
    expect(normalizeWhatsApp('+44', '0044 7911 123456')).toBe('+447911123456');
    expect(normalizeWhatsApp('+44', '12')).toBeNull();
  });

  it('counts steps from the first question and keeps review as the last step', () => {
    const repair = START_PATHS.repair;
    expect(progressFor(null, null).label).toBe('');
    expect(progressFor(repair, 'type')).toMatchObject({ current: 1, label: 'Step 1 of 9' });
    expect(progressFor(repair, 'review')).toMatchObject({
      fraction: 1,
      label: 'Last step: check your request',
    });
    expect(progressFor(repair, 'sent').label).toBe('');
  });

  it('clears a stale area when the state changes on review', () => {
    const repair = START_PATHS.repair;
    const answers = { state: 'lagos', area: 'Ikeja' };
    const changed = hrefAfterChoice(repair, 'state', 'lagos', 'abuja', true, answers);
    expect(changed).toEqual({ href: '/start/repair/area?from=review', clearArea: true });
    const same = hrefAfterChoice(repair, 'state', 'lagos', 'lagos', true, answers);
    expect(same.href).toBe('/start/repair/review');
    expect(same.clearArea).toBe(false);
  });

  it('requires a note when something else is selected', () => {
    const repair = START_PATHS.repair;
    const answers = {
      type: 'other',
      urgency: 'this-week',
      state: 'lagos',
      access: 'me',
      'visit-time': 'morning',
      'visit-day': 'tomorrow',
      note: 'leak',
    };
    expect(noteIsRequired(repair, answers)).toBe(true);
    expect(firstIncompleteStep(repair, answers, { name: 'Ada', whatsapp: '+2348012345678' })?.id).toBe('note');
    expect(answers.note.trim().length).toBeLessThan(NOTE_MIN_LENGTH);
    const done = { ...answers, note: 'The gate motor failed' };
    expect(firstIncompleteStep(repair, done, { name: '', whatsapp: '' })?.id).toBe('contact');
  });

  it('gives follow-up steps their own titles and drops saved drafts after 7 days', () => {
    const pages = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'follow-up-questions.json'), 'utf8'),
    ) as {
      labels: Record<string, string>;
      questions: Record<string, Record<string, string>>;
    };
    expect(seoForPathname('/start/repair/urgency')?.title).toBe(
      'How urgent is it? | Start a repair | BuildMyHouse',
    );
    expect(seoForPathname('/start/repair/urgency')?.robots).toBe('noindex,follow');
    expect(seoForPathname('/start/repair')?.title).toBe(START_PATHS.repair.seoTitle);

    for (const pathId of ['repair', 'upgrade', 'build', 'interiors'] as const) {
      const path = START_PATHS[pathId];
      for (const step of path.steps.slice(1)) {
        expect(pages.questions[pathId][step.id]).toBe(step.question);
        expect(followUpDocumentTitle(path, step.id)).toBe(
          `${step.question} | ${pages.labels[pathId]} | BuildMyHouse`,
        );
      }
      expect(pages.questions[pathId].sent).toBe('Request ready on WhatsApp');
    }

    expect(draftIsExpired(undefined)).toBe(true);
    expect(draftIsExpired(Date.now() - START_DRAFT_TTL_MS - 1000)).toBe(true);
    expect(draftIsExpired(Date.now())).toBe(false);
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

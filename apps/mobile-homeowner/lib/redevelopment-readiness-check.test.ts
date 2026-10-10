import { redevelopmentReadinessContent } from './redevelopment-readiness-content';
import {
  buildRedevelopmentReviewNotes,
  buildRedevelopmentWhatsAppMessage,
  emptyRedevelopmentBrief,
  validateRedevelopmentStep,
} from './redevelopment-readiness-check';

describe('redevelopment readiness check', () => {
  const brief = {
    ...emptyRedevelopmentBrief(),
    state: 'Lagos',
    city: 'Eti-Osa',
    area: 'Lekki',
    currentProperty: 'Building under construction',
    plannedUse: 'Apartments/flats',
    landSize: '1500',
    landSizeUnit: 'square metres' as const,
    occupancy: 'No',
    owners: 'Me only',
    ownersAligned: 'I am the sole owner',
    documents: ['Survey Plan', 'Deed of Assignment'],
    encumbrances: ['None that I know of'],
    stoppedWhen: '2022',
    stopReasons: ['I ran out of money'],
    unfinishedDuration: '3–5 years',
    constructionStage: 'Roofing',
    hasPhotos: 'Yes',
    investedUndisclosed: true,
    remainingCostKnown: 'Yes',
    remainingAmount: '80000000',
    remainingCurrency: 'NGN' as const,
    canContribute: 'No, I need the partner to provide the development capital',
    income: 'No',
    outcomes: ['Receive completed apartments/units'],
    openToSharing: 'Maybe, depending on the numbers',
    openToBot: 'I need this explained first',
    openToSeparateRoles: 'Yes',
    openToSellingPart: 'Maybe',
    helpRequested: ['Inspect my unfinished building'],
    allowInspection: 'Yes',
    payForAssessment: 'Possibly, depending on the proposal',
    timeline: 'Within 1–3 months',
    decisionMakers: 'Me only',
    decisionDiscussed: 'Not applicable',
    name: 'Ada Okafor',
    email: 'ada@example.com',
    whatsapp: '+2348012345678',
    country: 'United Kingdom',
  };

  it('builds the WhatsApp brief without a colour score or a return promise', () => {
    const message = buildRedevelopmentWhatsAppMessage(brief);
    expect(message).toContain('Hello BuildMyHouse,');
    expect(message).toContain('Lekki, Eti-Osa, Lagos');
    expect(message).toContain('1500 square metres');
    expect(message).toContain('NGN 80000000');
    expect(message).toContain("I don't know / I prefer not to say yet");
    expect(message).toContain('Please review this brief');
    expect(message.toLowerCase()).not.toContain('guaranteed');
    expect(message.toLowerCase()).not.toContain('crowdfund');
    expect(message).not.toMatch(/\bGREEN\b|\bYELLOW\b|\bRED\b/);
  });

  it('records factual review notes for a human, without rejecting the owner', () => {
    const notes = buildRedevelopmentReviewNotes({
      ...brief,
      ownersAligned: 'No',
      openToSharing: 'No',
      payForAssessment: 'No, I only want free developer introductions',
      allowInspection: 'No',
    });
    expect(notes).toContain('Ownership alignment is not in place.');
    expect(notes).toContain('free developer introductions');
    expect(notes).toContain('declined inspection');
    expect(notes).not.toMatch(/\breject\b|\bGREEN\b|\bYELLOW\b|\bRED\b/i);
  });

  it('asks for a remaining amount only when the owner says they have one', () => {
    expect(validateRedevelopmentStep({ ...brief, remainingCostKnown: 'Yes', remainingAmount: '' }, 3)).toMatch(/still required/);
    expect(validateRedevelopmentStep({ ...brief, remainingCostKnown: 'No', remainingAmount: '' }, 3)).toBe('');
  });

  it('speaks to the property owner, not to an internal planning note', () => {
    const article = `${redevelopmentReadinessContent.htmlBeforeTool}${redevelopmentReadinessContent.htmlAfterTool}`;
    expect(article).toContain('What BuildMyHouse does not promise');
    expect(article).not.toContain('should never tell you');
    expect(article).not.toContain('safer initial role');
    expect(article).not.toContain('building a pipeline');
    expect(article).not.toContain('We would first');
    expect(article).not.toContain('Put ₦2,000,000');
    expect(article.toLowerCase()).not.toContain('earn 25%');
    expect(article.toLowerCase()).not.toContain('guaranteed return');
  });
});

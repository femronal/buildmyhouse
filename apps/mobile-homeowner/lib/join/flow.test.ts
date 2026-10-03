import { effectiveSteps, guardHref, joinStaticParams, proofsForAnswers, buildJoinWhatsAppText } from './flow';

describe('join flow', () => {
  it('shows council only when it applies', () => {
    expect(proofsForAnswers('professional', { trade: 'architect' })).toContain('council');
    expect(proofsForAnswers('professional', { trade: 'project-manager' })).not.toContain('council');
    expect(proofsForAnswers('builders', { trade: 'general_contractor' })).toContain('council');
    expect(proofsForAnswers('builders', { trade: 'renovator' })).not.toContain('council');
    expect(proofsForAnswers('repairs', { trade: 'plumber' }).join(',')).not.toMatch(/council/);
    expect(proofsForAnswers('cleaning', {}).join(',')).not.toMatch(/council/);
    expect(proofsForAnswers('materials', {}).join(',')).not.toMatch(/council/);
  });

  it('includes every repairs trade once before something else', () => {
    const trade = effectiveSteps('repairs').find((step) => step.id === 'trade');
    const ids = (trade?.options || []).map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id !== 'something-else')).toHaveLength(24);
  });

  it('guards unknown steps', () => {
    expect(guardHref('cleaning', 'proof-council', {})).toBeTruthy();
  });

  it('builds a whatsapp message without forbidden words', () => {
    const text = buildJoinWhatsAppText({
      pathId: 'cleaning',
      answers: { trade: ['home-cleaning'], state: 'lagos', area: ['ikeja'], photos: 'will_send' },
      name: 'Ada',
      reference: 'BMH-JC-0421',
    });
    expect(text).toContain('BMH-JC-0421');
    expect(text.toLowerCase()).not.toContain('may not be recommended');
  });

  it('exports static params for follow-up steps', () => {
    const params = joinStaticParams();
    expect(params.some((item) => item.path === 'cleaning' && item.step === 'proof-cac')).toBe(true);
    expect(params.some((item) => item.step === 'sent')).toBe(true);
  });
});

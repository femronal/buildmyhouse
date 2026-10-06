import {
  getPropertyPurchaseLagosSchema,
  propertyPurchaseLagosDueDiligenceContent,
} from './property-purchase-lagos-due-diligence-content';
import {
  buildIntakeNotes,
  buildPropertyPurchaseWhatsAppMessage,
  emptyPropertyPurchaseBrief,
  formatAskingPrice,
} from './property-purchase-safety-check';

describe('property purchase safety check brief', () => {
  it('keeps an undisclosed price out of the amount line', () => {
    expect(
      formatAskingPrice({ priceAmount: '45000000', priceCurrency: 'NGN', priceUndisclosed: true }),
    ).toBe('I prefer not to say yet');
  });

  it('builds a WhatsApp brief from the answers without a colour score', () => {
    const brief = {
      ...emptyPropertyPurchaseBrief(),
      location: 'Lekki Phase 1',
      propertyType: 'Duplex',
      priceAmount: '180000000',
      priceCurrency: 'NGN' as const,
      inNigeria: 'No' as const,
      currentBase: 'London',
      foundVia: 'Agent',
      stage: 'I am negotiating',
      timeline: 'Within 30 days',
      concerns: ['Whether the title is genuine', 'Flooding'],
      otherConcern: 'The seller wants a deposit this week.',
      documents: ['Title document', 'Photos'],
      serviceReadiness: 'Yes',
      payForChecks: 'Possibly, depending on the proposal',
      decisionMaker: 'Me and my spouse',
      name: 'Ada Okonkwo',
      email: 'ada@example.com',
      whatsapp: '+44 7700 900123',
    };

    const message = buildPropertyPurchaseWhatsAppMessage(brief);

    expect(message).toContain('proposal for property verification and inspection');
    expect(message).toContain('Location: Lekki Phase 1');
    expect(message).toContain('Asking price: NGN 180000000');
    expect(message).toContain('Current country: London');
    expect(message).toContain('- Whether the title is genuine');
    expect(message).toContain('Also: The seller wants a deposit this week.');
    expect(message).toContain('Please review this information and let me know what checks you recommend before I proceed.');
    expect(message).not.toMatch(/\b(RED|YELLOW|GREEN)\b/);
    expect(message.toLowerCase()).not.toContain('escrow');
    expect(buildIntakeNotes(brief)).toContain('Willing to pay for professional checks: Possibly, depending on the proposal');
  });
});

describe('property purchase article schema', () => {
  it('publishes article, breadcrumb and FAQ structured data without escrow language', () => {
    const schema = getPropertyPurchaseLagosSchema() as { '@graph': Array<{ '@type'?: string }> };
    const types = schema['@graph'].map((node) => node['@type']);
    expect(types).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList', 'FAQPage']));
    const blob = JSON.stringify(propertyPurchaseLagosDueDiligenceContent).toLowerCase();
    expect(blob).not.toContain('escrow');
    expect(blob).not.toContain('laspa ');
    expect(blob).not.toContain('labsca');
  });
});

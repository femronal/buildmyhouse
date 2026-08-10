import type { ArticleBlock, ArticleFaqItem } from '@/lib/articles';
import type { InternalLinkItem } from '@/components/seo/InternalLinksBlock';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export const EGBEDA_WINDOW_CASE_STUDY_SLUG =
  'aluminium-window-repair-egbeda-lagos-buildmyhouse-case-study' as const;

export const EGBEDA_WINDOW_CASE_STUDY_PATH =
  `/articles/${EGBEDA_WINDOW_CASE_STUDY_SLUG}` as const;

export const EGBEDA_WINDOW_PROCESS_STEPS = [
  'Contractor screened',
  'Physical inspection',
  'Original replacement idea challenged',
  'Actual repair scope defined',
  'One-window boundary confirmed',
  'Materials and cost established',
  'Homeowner received transparent quote',
  'Initial stage payment released',
  'Material procurement documented',
  'Repair executed',
  'Contractor reported completion',
  'Homeowner independently confirmed completion',
  'Completion media documented',
] as const;

export const egbedaWindowCaseStudySeed = {
  slug: EGBEDA_WINDOW_CASE_STUDY_SLUG,
  title: 'She Thought Her Window Needed Replacement. The Inspection Said Otherwise.',
  seoTitle:
    'How BuildMyHouse Repaired a Leaking Aluminium Window in Lagos Without Replacing It',
  subtitle:
    'A real BuildMyHouse repair project in Egbeda, Lagos showing why inspection, clear scope, material evidence and stage-based payment should come before replacing anything in your home.',
  description:
    'Real aluminium window repair in Egbeda, Lagos: BuildMyHouse inspected first, reduced replacement to sealing and securing, documented materials, used staged payment, and confirmed completion with the homeowner.',
  excerpt:
    'A homeowner in Egbeda expected a window replacement. Inspection showed repair was enough — and BuildMyHouse tracked the job with clear scope, material evidence, and staged payment.',
  coverImageUrl: `${WEB_URL}/aluminium-window-repair-egbeda-cover.jpg`,
  coverImageAlt:
    'Aluminium window repair and weather sealing completed by a BuildMyHouse technician in Egbeda, Lagos',
  publishedAt: '2026-05-22',
  updatedAt: '2026-05-22',
  readingMinutes: 11,
  tags: [
    'case study',
    'real project stories',
    'repairs',
    'aluminium window repair Lagos',
    'home repairs Lagos',
    'diaspora',
  ],
  canonicalPath: EGBEDA_WINDOW_CASE_STUDY_PATH,
  articlePillar: 'renovate-abroad' as const,
  resourceSectionKeys: ['case-studies', 'articles', 'renovate-abroad', 'trust'],
  authorName: 'BuildMyHouse Editorial',
  audience: 'homeowner' as const,
  keyTakeaways: [
    'Inspection before replacement can save homeowners from unnecessary spending.',
    'Clear one-window scope prevented silent job expansion on site.',
    'Material evidence and stage-based payment kept a small repair accountable.',
    'Contractor “done” still needed independent homeowner completion confirmation.',
  ],
  faqs: [
    {
      question: 'Can a leaking aluminium window be repaired without replacement?',
      answer:
        'Yes. Some leaks come from failed sealant, gaps between the aluminium frame and wall, loose sections or other localized defects. A physical inspection should determine whether repair is sufficient before full replacement is approved.',
    },
    {
      question: 'How do I know whether my aluminium window needs repair or replacement?',
      answer:
        'Start with an inspection. The technician should identify whether the problem comes from the frame, glass, net, sealant, fittings, wall connection or structural damage before recommending replacement.',
    },
    {
      question: 'How much does aluminium window repair cost in Lagos?',
      answer:
        'Cost depends on the size of the window, fault, materials, access, labour and whether additional equipment is required. The BuildMyHouse Egbeda case involved an estimated repair scope of roughly ₦13,300 before a possible ladder-rental allowance, but this should not be treated as a universal Lagos price.',
    },
    {
      question: 'Should I pay a repair technician everything upfront?',
      answer:
        'For larger or structured repair jobs, it is safer to connect payments to defined stages such as inspection, material procurement, repair execution and completion confirmation rather than paying the entire amount before work begins.',
    },
    {
      question: 'What proof should I request before paying for repair materials?',
      answer:
        'Useful evidence may include shop receipts, invoices, transfer records, photos of purchased materials, seller details and a clear material list.',
    },
    {
      question: 'Can BuildMyHouse help me manage my parents’ home repairs from abroad?',
      answer:
        'Yes. BuildMyHouse helps homeowners structure repair requests, work with relevant professionals, follow project updates, review evidence and keep project communication more organized even when the homeowner is outside Nigeria.',
    },
    {
      question: 'Does BuildMyHouse only handle large construction projects?',
      answer:
        'No. BuildMyHouse supports repairs, upgrades, renovations, interior projects and full construction projects.',
    },
  ] satisfies ArticleFaqItem[],
  internalLinks: [
    {
      label: 'Contractor vetting guide for diaspora homeowners',
      href: '/guides/contractor-vetting-nigeria-diaspora',
    },
    {
      label: 'Milestone payment schedule builder',
      href: '/tools/milestone-payment-schedule',
    },
    {
      label: 'Renovate in Nigeria from abroad',
      href: '/diaspora/renovate-in-nigeria-from-abroad',
    },
    {
      label: 'UK guide: renovate your parents’ house',
      href: '/diaspora/uk/renovate-parents-house',
    },
    {
      label: 'Home renovation in Nigeria',
      href: '/renovation/nigeria',
    },
    {
      label: 'Window & aluminium repair in Nigeria',
      href: '/services/window-repair-nigeria',
    },
    {
      label: 'Renovation checklist for homeowners',
      href: '/articles/renovation-checklist-for-homeowners-nigeria',
    },
  ] satisfies InternalLinkItem[],
  blocks: [
    { type: 'heading', text: 'She Thought the Window Needed Replacement' },
    {
      type: 'paragraph',
      text: 'Rainwater and dirt were entering through sections of a large aluminium window at a home in Gowon Estate, Egbeda, Lagos.',
    },
    {
      type: 'paragraph',
      text: 'Some edges were not properly secured against the surrounding wall. From inside the house, the problem felt obvious: water was getting in where it should not.',
    },
    {
      type: 'paragraph',
      text: 'The homeowner initially believed the window net — or even the window itself — might need replacement. That reaction is understandable. When water keeps entering, replacing the whole thing sounds like the obvious solution.',
    },
    {
      type: 'paragraph',
      text: 'But replacing something before inspection can mean paying for work that was never necessary.',
    },
    {
      type: 'quote',
      text: 'That is exactly what this project demonstrated.',
    },

    { type: 'heading', text: 'BuildMyHouse Did Not Start With “How Much?”' },
    {
      type: 'paragraph',
      text: 'Before sending an artisan directly to the property, BuildMyHouse screened the aluminium engineer. Identity and work-location information were requested, along with evidence that he actually operated as an aluminium engineer.',
    },
    {
      type: 'paragraph',
      text: 'This was not presented as a full platform verification badge covering every current BuildMyHouse contractor standard. It was a practical first layer of accountability.',
    },
    {
      type: 'callout',
      text: 'Before somebody is allowed into a homeowner’s property, there should be some accountability around who that person is and where they can be located. For a fuller checklist, see the [contractor vetting guide for diaspora homeowners](/guides/contractor-vetting-nigeria-diaspora).',
    },

    { type: 'heading', text: 'The Inspection Changed Everything' },
    {
      type: 'paragraph',
      text: 'On May 19, 2026, Taiwo inspected the window.',
    },
    {
      type: 'paragraph',
      text: 'The original assumption had been replacement — especially of the window net. After physical inspection, that assumption did not hold.',
    },
    {
      type: 'paragraph',
      text: 'Full replacement was unnecessary. The main problem could be addressed by:',
    },
    {
      type: 'bullets',
      items: [
        'Sealing defective gaps',
        'Correcting areas where the aluminium frame did not meet the wall properly',
        'Securing affected sections',
        'Using silicone/sealant and screws where necessary',
      ],
    },
    {
      type: 'quote',
      text: 'The homeowner came into the project expecting replacement. She left the inspection needing only a repair.',
    },
    {
      type: 'paragraph',
      text: 'This matters because a contractor who automatically agrees to replace everything may generate a bigger invoice. A proper diagnosis should decide the scope — especially for aluminium window repair in Lagos, where rainwater entering an aluminium window often looks more dramatic than the fix required.',
    },

    { type: 'heading', text: 'One Window. One Defined Scope.' },
    {
      type: 'paragraph',
      text: 'The final approved repair covered one large window. Approximate artisan-reported size: 2400 × 1200 mm.',
    },
    {
      type: 'paragraph',
      text: 'The homeowner had discussed more than one window earlier, but the approved project remained limited to one.',
    },
    {
      type: 'paragraph',
      text: 'Clear scope matters. The fact that an artisan is already on site should not silently turn one repair into several additional jobs. Every extra item should become an explicit scope decision — the same discipline used in [remote renovation planning](/diaspora/renovate-in-nigeria-from-abroad).',
    },

    { type: 'heading', text: 'What Did the Repair Cost?' },
    {
      type: 'paragraph',
      text: 'These figures came from project chat — not a universal Lagos price list.',
    },
    {
      type: 'bullets',
      items: [
        'Silicone/sealant — approximately ₦7,500',
        'Screws — ₦300',
        'Transport/workmanship — ₦5,500',
        'Initial estimated total — ₦13,300',
        'Possible ladder rental — ₦2,000',
        'Possible total if ladder was needed — approximately ₦15,300',
      ],
    },
    {
      type: 'paragraph',
      text: 'BuildMyHouse repeatedly asked the contractor whether the quoted amount would be sufficient to complete the agreed scope. Treat ₦15,300 as a possible upper figure discussed in chat — not as an unquestionably final amount paid.',
    },

    { type: 'heading', text: 'Why the Homeowner Received a Quote for a Free Repair' },
    {
      type: 'paragraph',
      text: 'BuildMyHouse was covering this project under its free repair campaign. The homeowner therefore asked a fair question: why was she receiving a quotation?',
    },
    {
      type: 'paragraph',
      text: 'BuildMyHouse still documented the cost so she could see what was being repaired, what the artisan was charging, what BuildMyHouse was paying for, and what had been authorized.',
    },
    {
      type: 'quote',
      text: 'Free should not mean invisible. Transparency still matters when the homeowner is not the person paying the bill.',
    },

    { type: 'heading', text: 'The Contractor Did Not Receive Everything Upfront' },
    {
      type: 'paragraph',
      text: 'The artisan confirmed receiving ₦12,000 for the initial stages, including inspection, scope definition, and material procurement. The remaining balance was intended to follow completion.',
    },
    {
      type: 'paragraph',
      text: 'The principle is simple: Prepare → Repair → Confirm → Balance. That stage-based project philosophy is the same idea behind the [milestone payment schedule builder](/tools/milestone-payment-schedule).',
    },
    {
      type: 'callout',
      text: 'This case study does not claim that the final contractor balance was conclusively paid in the available project record. What is clear is the staged approach: not everything went out upfront.',
    },

    { type: 'heading', text: 'Even the Silicone Had to Be Documented' },
    {
      type: 'paragraph',
      text: 'BuildMyHouse requested receipts and material evidence before execution.',
    },
    {
      type: 'paragraph',
      text: 'The artisan reported buying silicone/sealant and screws. The silicone reportedly cost ₦7,250 after a ₦250 discount.',
    },
    {
      type: 'paragraph',
      text: 'The supplier did not issue a normal receipt. Instead of abandoning documentation, BuildMyHouse requested alternative evidence:',
    },
    {
      type: 'bullets',
      items: [
        'Transfer evidence',
        'Written purchase evidence',
        'Photographs of materials',
        'Photograph of the silicone gun/equipment',
      ],
    },
    {
      type: 'quote',
      text: 'If a ₦7,250 material purchase on a small repair deserves documentation, imagine the discipline required for a ₦50 million building project.',
    },
    {
      type: 'paragraph',
      text: 'Documentation is not an accusation. It is a system — the same system diaspora homeowners need when managing [property repairs in Nigeria from abroad](/diaspora/renovate-in-nigeria-from-abroad).',
    },

    { type: 'heading', text: 'Repair Day' },
    {
      type: 'paragraph',
      text: 'On May 22, 2026, Taiwo travelled to the property and completed the repair.',
    },
    {
      type: 'paragraph',
      text: 'At approximately 1:57 p.m., he reported: “Done.”',
    },

    {
      type: 'heading',
      text: 'The Contractor Said “Done.” BuildMyHouse Still Checked With the Homeowner.',
    },
    {
      type: 'paragraph',
      text: 'Shortly afterwards, the homeowner independently contacted BuildMyHouse. She said: “He has done it.” She also submitted pictures and videos showing the completed repair.',
    },
    {
      type: 'paragraph',
      text: 'Contractor self-confirmation alone is weak. The person performing the work should not be the only source saying the work happened.',
    },
    {
      type: 'paragraph',
      text: 'This project had three layers:',
    },
    {
      type: 'bullets',
      items: [
        'Contractor completion signal',
        'Homeowner completion confirmation',
        'Visual completion media',
      ],
    },
    {
      type: 'callout',
      text: 'Important distinction: the homeowner confirmed the work was done. The available record does not include an explicit “I am satisfied” satisfaction confirmation. Completion confirmation and satisfaction confirmation are not the same thing — and BuildMyHouse treats them as separate.',
    },

    { type: 'heading', text: 'What Was Actually Repaired?' },
    {
      type: 'paragraph',
      text: 'The window was not completely replaced. The project appears to have involved sealing defective gaps, securing affected aluminium sections, correcting places where the frame was not properly meeting the wall, applying silicone/sealant, using screws where required, and reducing likely rainwater and dirt entry paths.',
    },
    {
      type: 'paragraph',
      text: 'This case study does not claim a new window was installed, a new window net was installed, two windows were repaired, a rain shed was definitely installed, or that rainwater will never enter again.',
    },
    {
      type: 'paragraph',
      text: 'What it does show is targeted aluminium window maintenance in Lagos — window sealing done after diagnosis, not after assumption.',
    },

    { type: 'heading', text: 'The Most Important Lesson: Repair Before Replace' },
    {
      type: 'paragraph',
      text: 'Homeowners often assume that a faulty item must be replaced. But many property problems need inspection, diagnosis, targeted correction, and testing before replacement should even be considered.',
    },
    {
      type: 'paragraph',
      text: 'That applies to windows, doors, roofing, plumbing, pumps, electrical systems, AC units, and appliances. A trustworthy repair process should tell you when not to spend more money.',
    },
    {
      type: 'paragraph',
      text: 'If you are comparing repair versus renovation more broadly, start with the [home renovation in Nigeria hub](/renovation/nigeria) and the [renovation checklist for homeowners](/articles/renovation-checklist-for-homeowners-nigeria).',
    },

    { type: 'heading', text: 'How BuildMyHouse Managed the Repair' },
    {
      type: 'paragraph',
      text: 'The trust loop for this aluminium window repair looked like this:',
    },
    {
      type: 'bullets',
      items: [...EGBEDA_WINDOW_PROCESS_STEPS],
    },
    {
      type: 'paragraph',
      text: 'For window and aluminium work more generally, see [window and aluminium repair in Nigeria](/services/window-repair-nigeria).',
    },

    { type: 'heading', text: 'What This Project Taught Us' },
    {
      type: 'paragraph',
      text: 'BuildMyHouse should not pretend the project was perfect. A useful case study also shows what to improve.',
    },
    {
      type: 'bullets',
      items: [
        'Contractor verification should be more standardized inside the platform.',
        'Contractor quotes should require material, quantity, transport, equipment and workmanship breakdown before submission.',
        'Equipment requirements such as ladder rental should be settled during inspection.',
        'Small suppliers need a formal receipt-alternative process.',
        'Final contractor payouts should be automatically recorded.',
        '“Work completed” and “Homeowner satisfied” should be two separate project confirmations.',
      ],
    },

    { type: 'heading', text: 'If You Are Abroad and Your Parents Need a Repair' },
    {
      type: 'paragraph',
      text: 'If you are a Nigerian abroad managing home repairs, this story may feel familiar.',
    },
    {
      type: 'paragraph',
      text: 'Your parent sends a picture. Something is leaking, damaged or broken. Someone introduces “one guy.” Money is requested. You have no idea whether replacement is necessary, whether the quote is reasonable, whether materials were bought, whether work happened, or whether the repair actually solved the problem.',
    },
    {
      type: 'paragraph',
      text: 'BuildMyHouse exists to make this type of work more structured — especially for remote property repairs in Nigeria and for people renovating parents’ homes from the UK or elsewhere. Start with [renovate in Nigeria from abroad](/diaspora/renovate-in-nigeria-from-abroad) or the [UK parents’ house renovation guide](/diaspora/uk/renovate-parents-house).',
    },

    { type: 'heading', text: 'Start With Inspection, Not Assumption' },
    {
      type: 'paragraph',
      text: 'Sometimes the biggest saving on a property project does not come from negotiating harder. It comes from discovering that the expensive work you planned was unnecessary.',
    },
    {
      type: 'paragraph',
      text: 'That is what happened here. The homeowner thought replacement was needed. Inspection showed repair was enough.',
    },
    {
      type: 'paragraph',
      text: 'Need a repair, renovation or property upgrade in Nigeria? Start your project with BuildMyHouse.',
    },
    {
      type: 'cta',
      label: 'Start a tracked repair with BuildMyHouse',
      href: '/book-repair',
      note: 'Begin with inspection and clear scope — not with an assumed replacement.',
    },
  ] satisfies ArticleBlock[],
};

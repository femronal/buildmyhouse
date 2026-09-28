export type ToolPageFaq = { q: string; a: string };
export type ToolPageLine = { label: string; value: string };
export type JourneyNode =
  | { slug: string }
  | { title: string; href: string; tagline: string; live: boolean };

export type ToolPageCopy = {
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  outcome: string;
  supporting: string[];
  primaryCta: string;
  secondaryCta?: string;
  timeNote?: string;
  problemHeadline: string;
  problemIntro: string[];
  without: string[];
  with: string[];
  inputs: { label: string; why: string }[];
  outputs: { label: string; detail: string }[];
  trustLine?: string;
  trustDetail?: string;
  steps: { title: string; detail: string }[];
  journeyWhy: string;
  journey: JourneyNode[];
  homeowner: string;
  professional: string;
  waitlistHeading: string;
  waitlistCopy: string;
  preview: {
    kicker: string;
    title: string;
    lines: ToolPageLine[];
    illustrative: boolean;
  };
  faq: ToolPageFaq[];
  education?: {
    heading: string;
    paragraphs?: string[];
    steps?: { title: string; detail: string }[];
  }[];
  extraLinks?: { label: string; href: string }[];
};

export const MONEY_FAQ: ToolPageFaq = {
  q: 'Does BuildMyHouse hold my money?',
  a: 'No. BuildMyHouse does not hold your money through this tool. It does not safeguard, escrow, or release customer funds. BuildMyHouse is not a bank or escrow company.',
};

const pages: Record<string, ToolPageCopy> = {
  'price-checker': {
    seoTitle: 'Building Material Price Checker Nigeria | BuildMyHouse',
    seoDescription:
      'Check current Nigerian building-material prices using traceable market evidence, source dates and a confidence score before accepting a quote.',
    eyebrow: 'Building cost & price tool',
    outcome:
      "Check what a building material is selling for in Nigeria before you accept a contractor's or supplier's price.",
    supporting: [
      'Building-material prices can change quickly, and the same product can be sold at different prices depending on the specification, seller and location.',
      'Price Checker helps you research the market before you make a decision. Search for the material, answer a few questions about the exact specification and location, and BuildMyHouse shows the evidence it found.',
    ],
    primaryCta: 'Check a price',
    secondaryCta: 'See an example report',
    problemHeadline: 'A price is easier to question when you know what the market is saying',
    problemIntro: [
      'Many homeowners receive a material price through a contractor, supplier, relative or WhatsApp message and have no easy way to judge whether it is reasonable.',
      'The problem is not that every high price is fraudulent. Different brands, specifications, transport costs and locations can produce different prices. The real problem is making a decision without enough evidence.',
    ],
    without: [
      'You may compare prices for products that are not actually the same specification.',
      "One seller's price can look like the market price even when it is only one listing.",
      'You may not know how recent the information is.',
    ],
    with: [
      'See a researched price range rather than relying on one number.',
      'See where the evidence came from.',
      'See when the evidence was checked.',
      'See a confidence score explaining how strong the available evidence is.',
    ],
    inputs: [
      {
        label: 'Material',
        why: 'We need the exact material before we can compare relevant market evidence.',
      },
      {
        label: 'Specification',
        why: 'Two products with similar names can have very different prices. The checker asks about type, size, brand or other details when they matter.',
      },
      {
        label: 'Location',
        why: 'Building-material prices and transport conditions can vary between locations. You pick a place from the locations the checker currently supports.',
      },
      {
        label: 'Clarifying questions',
        why: 'Answer any extra questions Price Checker asks. Better detail normally produces a more useful comparison.',
      },
    ],
    outputs: [
      {
        label: 'Researched price range',
        detail: 'A range based on relevant market evidence rather than one seller’s number.',
      },
      {
        label: 'Traceable sources',
        detail: 'See where the evidence came from.',
      },
      {
        label: 'Date checked',
        detail: 'Understand how recent each piece of evidence is.',
      },
      {
        label: 'Confidence score',
        detail: 'A score out of 100, with a short explanation of how confident the tool is and why.',
      },
      {
        label: 'Evidence quality',
        detail:
          'The score considers how many independent sellers were found, how recent the evidence is, and whether the specification and location match.',
      },
      {
        label: 'Honest weak-evidence state',
        detail:
          'If the evidence is not strong enough, the tool says so. You can then request a verified local market check by a BuildMyHouse agent on WhatsApp.',
      },
    ],
    trustLine: 'Real prices. Never invented.',
    trustDetail:
      'Price Checker does not manufacture a market price simply because evidence is missing. Figures on a finished report come from the listings the checker accepted.',
    steps: [
      { title: 'Search for the material', detail: 'Tell us what you want to price.' },
      { title: 'Clarify the specification', detail: 'Answer a few questions so we compare the right product.' },
      {
        title: 'We research available evidence',
        detail: 'The system checks relevant traceable listings and removes unsuitable or duplicate evidence.',
      },
      { title: 'Review the result', detail: 'See the range, sources and confidence before making your own decision.' },
    ],
    journeyWhy:
      'Start with an overall budget direction, check important material prices, and then compare the contractor’s full quotation.',
    journey: [
      { slug: 'nigeria-building-cost-planner' },
      { slug: 'price-checker' },
      { slug: 'contractor-quote-comparison' },
      { slug: 'material-price-watchlist' },
      { slug: 'quotation-fairness-review' },
    ],
    homeowner:
      'Useful when somebody back home sends you a material price and you want independent market context before deciding what to do.',
    professional:
      'Quantity surveyors, architects, contractors and project managers can use Price Checker as an additional market-research reference when discussing current prices with clients. It does not replace professional cost advice.',
    waitlistHeading: 'Notify me about new BuildMyHouse tools',
    waitlistCopy: 'Price Checker is live. Leave your email if you want to hear when another tool opens.',
    preview: {
      kicker: 'Example of the report layout',
      title: 'Price report',
      illustrative: true,
      lines: [
        { label: 'Material', value: 'The product you searched' },
        { label: 'Location', value: 'The place you selected' },
        { label: 'Price range', value: 'Low to high, from the listings found' },
        { label: 'Evidence checked', value: 'Each source, with the date it was checked' },
        { label: 'Confidence', value: 'A score out of 100, with the reasons' },
      ],
    },
    faq: [
      {
        q: 'Are the prices on Price Checker current?',
        a: 'Price Checker shows when its evidence was checked. Building-material prices can change, so look at the source dates and confidence information before relying on a result.',
      },
      {
        q: 'Does Price Checker give one official Nigerian market price?',
        a: 'No. There is rarely one single price across every seller and location. The tool provides a researched range from available evidence.',
      },
      {
        q: 'Can I check prices in Lagos?',
        a: 'Yes. The location list includes Lagos, including Lagos Mainland, Lagos Island / Lekki axis, Ikeja, Yaba and Ajah, plus other states and cities the checker currently supports, such as Abuja (FCT), Ogun and Edo. Choose the place that matches where you need the material. If a town is not in the list, the checker cannot price it for that place.',
      },
      {
        q: 'Why does the tool ask for the specification?',
        a: 'Because different sizes, brands and specifications can have very different prices even when people casually call them the same material.',
      },
      {
        q: 'What happens if BuildMyHouse cannot find enough reliable evidence?',
        a: 'The tool tells you when confidence is weak rather than inventing a price. From that report you can request a verified local market check, where a BuildMyHouse agent confirms current prices on WhatsApp.',
      },
      {
        q: 'Does this replace a quantity surveyor?',
        a: 'No. Price Checker is a market-research tool. A quantity surveyor can provide deeper professional cost planning, measurement and project advice.',
      },
    ],
  },
  'construction-scam-red-flag-checker': {
    seoTitle: 'Construction Scam Red-Flag Checker Nigeria | BuildMyHouse',
    seoDescription:
      'Review payment terms, pressure tactics and missing paperwork before committing money to a Nigerian construction or repair arrangement.',
    eyebrow: 'Contractor & payment safety tool',
    outcome: 'Spot warning signs in a proposed construction arrangement before you commit money.',
    supporting: [
      'Not every disagreement, high quote or delayed project is a scam. Some arrangements still contain warning signs that a homeowner should investigate before proceeding.',
      'This tool will walk you through questions about payment terms, urgency, documentation, who you are dealing with, and what has actually been agreed, then organise obvious warning signs into a simple report.',
    ],
    primaryCta: 'Join the early-access list',
    problemHeadline: 'The time to question a bad arrangement is before more money moves',
    problemIntro: [
      'Pressure can push a payment through before the important questions are answered.',
    ],
    without: [
      'Pressure can make you send money before important questions are answered.',
      'Important documents or scope details may be missing without you noticing.',
      'You may confuse confidence, reputation or urgency with actual evidence.',
    ],
    with: [
      'Walk through the arrangement systematically.',
      'Surface obvious warning signs before committing.',
      'See what information is still missing.',
      'Know which questions need answers before you continue.',
    ],
    inputs: [
      {
        label: 'Payment terms',
        why: 'Unclear or heavily front-loaded payment arrangements deserve closer review.',
      },
      {
        label: 'Urgency',
        why: 'Artificial pressure can prevent proper checking.',
      },
      {
        label: 'Scope and agreement',
        why: 'It is difficult to judge performance when nobody clearly documented what should be done.',
      },
      {
        label: 'Documentation',
        why: 'Missing receipts, company details or written records can increase uncertainty.',
      },
      {
        label: 'How you found them',
        why: 'A referral or online profile alone does not prove that an arrangement is safe.',
      },
    ],
    outputs: [
      { label: 'Warning-sign summary', detail: 'A simple overview of areas that need attention.' },
      {
        label: 'Risk areas',
        detail: 'Payment, urgency, documentation, identity or business information, and unclear scope.',
      },
      { label: 'Missing-information checklist', detail: 'Important questions or documents that are still missing.' },
      { label: 'Suggested next questions', detail: 'Practical questions to ask before you proceed.' },
    ],
    trustLine: 'It does not declare that someone is a scammer.',
    trustDetail:
      'The report identifies warning signs from the information you provide. It is not a fraud certificate and it is not legal advice.',
    steps: [
      { title: 'Describe the arrangement', detail: 'Tell the checker what you have been offered.' },
      { title: 'Answer structured questions', detail: 'Walk through payment, urgency and documentation.' },
      { title: 'Review the warning signs', detail: 'See which parts of the arrangement deserve more checking.' },
      { title: 'Decide what to verify next', detail: 'Use the report to ask better questions before committing.' },
    ],
    journeyWhy:
      'Check who you are dealing with, review the arrangement, then put scope and payment expectations into a clearer structure.',
    journey: [
      { slug: 'contractor-verification-passport' },
      { slug: 'construction-scam-red-flag-checker' },
      { slug: 'milestone-payment-schedule' },
      { slug: 'contract-builder-small-repairs' },
      { title: 'Start a tracked project', href: '/start', tagline: 'Move the work onto a tracked BuildMyHouse project.', live: true },
    ],
    homeowner:
      'Useful before paying a contractor, artisan or project representative when something about the arrangement feels unclear. It is particularly relevant when you are managing the work from another city or country.',
    professional:
      'Lawyers, quantity surveyors, architects and project consultants may use the tool as an educational checklist with clients. It is not a substitute for professional due diligence.',
    waitlistHeading: 'Be first to test the Construction Scam Red-Flag Checker',
    waitlistCopy: 'Join the early-access list and BuildMyHouse will let you know when testing opens.',
    preview: {
      kicker: 'Example — not a real assessment',
      title: 'Risk review',
      illustrative: true,
      lines: [
        { label: 'Payment structure', value: 'Needs attention' },
        { label: 'Written scope', value: 'Missing' },
        { label: 'Urgency pressure', value: 'High' },
        { label: 'Next action', value: 'Ask for a written scope and a payment breakdown' },
      ],
    },
    faq: [
      {
        q: 'Can this tool tell me if a contractor is a scammer?',
        a: 'No. The tool is designed to identify warning signs in an arrangement. It cannot prove that a person is fraudulent.',
      },
      {
        q: 'What kind of warning signs will it check?',
        a: 'The planned tool focuses on areas such as unusual payment pressure, urgency, missing paperwork and unclear project arrangements.',
      },
      {
        q: 'Can Nigerians abroad use it?',
        a: 'Yes. It is particularly relevant when you are managing property work remotely and need a structured way to question an arrangement.',
      },
      {
        q: 'Does it replace a lawyer?',
        a: 'No. If the issue requires legal due diligence or legal advice, speak with a qualified lawyer.',
      },
      {
        q: 'Is the result a fraud report?',
        a: 'No. It is a warning-sign review based on the information you provide.',
      },
    ],
  },
  'contractor-quote-comparison': {
    seoTitle: 'Compare Contractor Quotes in Nigeria | BuildMyHouse',
    seoDescription:
      'Compare contractor quotations item by item, uncover missing items and understand where prices or allowances differ before choosing a contractor.',
    eyebrow: 'Hiring & budget tool',
    outcome: 'Put different contractor quotations into one clear comparison before deciding who to hire.',
    supporting: [
      'Two contractors can price the same project in completely different formats. One may separate labour and materials. Another may give a lump sum. One may include an item that another has quietly left out.',
      'This tool is being built to line quotations up item by item so you can see the differences more clearly.',
    ],
    primaryCta: 'Join the early-access list',
    problemHeadline: 'The cheapest quotation is not always the cheapest project',
    problemIntro: [
      'A low total can hide missing work. Allowances and specifications may not match, so comparing only the final figures can be misleading.',
    ],
    without: [
      'Different formats make quotes difficult to compare.',
      'A low total can hide missing work.',
      'Allowances and specifications may not match.',
      'You may compare totals instead of comparing what each contractor is actually offering.',
    ],
    with: [
      'Align similar items in one view.',
      'Highlight missing line items.',
      'Show uneven allowances or specifications.',
      'Make important differences easier to discuss before hiring.',
    ],
    inputs: [
      { label: 'Quotation 1', why: 'Your first contractor’s quotation.' },
      { label: 'Quotation 2', why: 'The competing quotation.' },
      {
        label: 'Additional quotations',
        why: 'If the finished tool supports more than two, you will be able to add them. This page does not promise a file upload until that is built.',
      },
      { label: 'Project context', why: 'Optional information about what is being priced.' },
    ],
    outputs: [
      { label: 'Item-by-item comparison', detail: 'Similar lines placed next to each other.' },
      { label: 'Missing-item flags', detail: 'Work that appears in one quotation and not the other.' },
      { label: 'Allowance and specification flags', detail: 'Places where the quotes are not describing the same thing.' },
      { label: 'Price differences', detail: 'Where the amounts differ, once both quotes include the item.' },
      { label: 'Questions to ask', detail: 'Points worth raising with each contractor before you hire.' },
    ],
    trustLine: 'A higher price is not automatically an inflated price.',
    trustDetail:
      'The tool does not decide which contractor is best. Different scope and quality can justify different prices.',
    steps: [
      { title: 'Add the quotations', detail: 'Bring the quotes you already have into one place.' },
      { title: 'Comparable items are identified', detail: 'The tool looks for lines that should sit side by side.' },
      { title: 'Differences are surfaced', detail: 'Missing items and uneven allowances become easier to see.' },
      { title: 'Review before you decide', detail: 'Use the comparison in the hiring conversation. It does not choose for you.' },
    ],
    journeyWhy:
      'Define the work, check important prices, compare the quotations, and then get professional review where necessary.',
    journey: [
      { slug: 'price-checker' },
      { slug: 'scope-of-work-generator' },
      { slug: 'contractor-quote-comparison' },
      { slug: 'quotation-fairness-review' },
      { slug: 'boq-in-plain-english' },
    ],
    homeowner:
      'Useful when two or more contractors have sent quotes that look completely different, including when someone says one contractor is cheaper and you need to see whether both priced the same job.',
    professional:
      'Quantity surveyors and project consultants can use it as a client-facing comparison aid. It does not replace a professional tender analysis.',
    waitlistHeading: 'Compare quotations before choosing a contractor',
    waitlistCopy:
      'Join the early-access list and we will notify you when the Contractor Quote Comparison Tool is ready for testing.',
    preview: {
      kicker: 'Example only — not real quotations',
      title: 'Quote comparison',
      illustrative: true,
      lines: [
        { label: 'Floor tiles', value: 'Both included · different allowance' },
        { label: 'Electrical fittings', value: 'Included in one · not shown in the other' },
        { label: 'Painting', value: 'Both included · price difference' },
      ],
    },
    faq: [
      {
        q: 'Will this tool tell me which contractor to hire?',
        a: 'No. It helps make quotation differences easier to see. The final decision should also consider experience, scope, quality, references and professional advice where necessary.',
      },
      {
        q: 'Why can two contractors give very different quotes?',
        a: 'They may be pricing different specifications, quantities, allowances, labour arrangements or even different scopes of work.',
      },
      {
        q: 'Can the cheapest quote still cost more later?',
        a: 'Yes, especially if important work was excluded. That is why it is useful to compare what is inside each quote rather than only the total.',
      },
      {
        q: 'Will the tool detect missing items?',
        a: 'The planned tool is designed to make missing or unmatched line items easier to spot.',
      },
      {
        q: 'Does this replace a quantity surveyor?',
        a: 'No. A quantity surveyor can provide professional cost and tender advice.',
      },
    ],
  },
  'nigeria-building-cost-planner': {
    seoTitle: 'Nigeria Building Cost Planner | BuildMyHouse',
    seoDescription:
      'Create an early stage-by-stage building budget for a Nigerian property project before final drawings, BOQs and contractor quotations are complete.',
    eyebrow: 'Early building budget tool',
    outcome: 'Get an early stage-by-stage budget direction before your drawings, BOQ and final quotations are ready.',
    supporting: [
      'Many people want to know how much it will cost to build a house in Nigeria. The honest answer depends on much more than the number of bedrooms.',
      'Location, size, building type, finish level, design and current market conditions can all affect cost. This planner is being built to help you create a preliminary budget direction without pretending that an early estimate is a final construction price.',
    ],
    primaryCta: 'Join the early-access list',
    problemHeadline: 'You need a budget before you need a perfect number',
    problemIntro: [
      'An early figure is for planning. It is not a contractor’s price and it is not a bill of quantities.',
    ],
    without: [
      'Homeowners may start planning around a random cost per square metre.',
      'A single lump-sum estimate hides how money may be distributed across the project.',
      'Old prices can quickly become misleading.',
    ],
    with: [
      'Start with a preliminary planning range.',
      'See the project stage by stage.',
      'See the assumptions and date behind the estimate.',
      'Know that the figure will need refinement as drawings, a BOQ and specifications become clearer.',
    ],
    inputs: [
      { label: 'Location', why: 'Labour, transport and market conditions vary.' },
      { label: 'Building type', why: 'Different types of buildings require different work.' },
      { label: 'Approximate size', why: 'The planner needs a basic sense of the project’s size.' },
      { label: 'Finish expectation', why: 'Finishing choices can materially affect overall cost.' },
      {
        label: 'What you already know',
        why: 'The more clearly defined the project is, the more useful an early budget can become.',
      },
    ],
    outputs: [
      { label: 'Preliminary stage ranges', detail: 'A budget direction split by stage, not one unexplained lump sum.' },
      { label: 'Dated assumptions', detail: 'The date behind the estimate, because construction prices change.' },
      {
        label: 'A clear limit',
        detail: 'The result is not a bill of quantities and it is not a contractor quotation.',
      },
      {
        label: 'A sensible next step',
        detail: 'Check important material prices, get a more detailed professional estimate, or structure milestone payments.',
      },
    ],
    trustLine: 'An early estimate is not a final construction price.',
    trustDetail: 'Treat the result as budget direction. Refine it when drawings, specifications and current prices are clearer.',
    steps: [
      { title: 'Describe the project', detail: 'Say what you are hoping to build.' },
      { title: 'Add location and scale', detail: 'Give the planner a basic sense of where and how large the project is.' },
      { title: 'Review the stage ranges', detail: 'Look at the preliminary ranges and the assumptions behind them.' },
      {
        title: 'Refine later',
        detail: 'Update the budget with drawings, a BOQ, current prices and professional advice.',
      },
    ],
    journeyWhy: 'Understand the land, create the first budget, check important market prices, and then organise how the money should move.',
    journey: [
      { slug: 'land-purchase-risk-checker' },
      { slug: 'nigeria-building-cost-planner' },
      { slug: 'price-checker' },
      { slug: 'milestone-payment-schedule' },
      { slug: 'budget-contingency-calculator' },
    ],
    homeowner:
      'Useful for first-time builders, Nigerians abroad planning a house back home, and landowners asking whether they can realistically afford to start.',
    professional:
      'Architects and quantity surveyors may use the planner to help clients understand the difference between an early planning estimate and a proper professional cost plan.',
    waitlistHeading: 'Plan the budget before construction pressure begins',
    waitlistCopy: 'Join the early-access list for the Nigeria Building Cost Planner.',
    preview: {
      kicker: 'Example — not a quotation',
      title: 'Preliminary building budget',
      illustrative: true,
      lines: [
        { label: 'Site preparation', value: 'Planning range · dated assumption' },
        { label: 'Foundation', value: 'Planning range · dated assumption' },
        { label: 'Structure', value: 'Planning range · dated assumption' },
        { label: 'Roofing', value: 'Planning range · dated assumption' },
        { label: 'Services', value: 'Planning range · dated assumption' },
        { label: 'Finishes', value: 'Planning range · dated assumption' },
      ],
    },
    faq: [
      {
        q: 'How much does it cost to build a house in Nigeria?',
        a: 'There is no single reliable figure for every house. Cost depends on location, size, design, specification, market conditions and many other factors.',
      },
      {
        q: 'Is this a final construction estimate?',
        a: 'No. It is intended to provide preliminary budget direction before the project is fully defined.',
      },
      {
        q: 'Is this the same as a BOQ?',
        a: 'No. A bill of quantities is a much more detailed professional document.',
      },
      {
        q: 'Can Nigerians abroad use it?',
        a: 'Yes. It can help create an early planning framework before committing to a project in Nigeria.',
      },
      {
        q: 'Why are the estimates dated?',
        a: 'Construction prices change. Showing the assumption date helps you understand when the estimate was produced.',
      },
    ],
  },
  'property-repair-triage': {
    seoTitle: 'Property Repair Triage Assistant Nigeria | BuildMyHouse',
    seoDescription:
      'Describe a property problem and get guidance on likely urgency, the type of professional you may need and the sensible next step.',
    eyebrow: 'Repair decision tool',
    outcome:
      'Describe what is going wrong in your property and get clearer guidance on how urgently to act and who may need to inspect it.',
    supporting: [
      'When something goes wrong in a house, the first question is often not how much it will cost. It is what is wrong, how urgent it is, and who you should call.',
      'This tool is being built to guide homeowners through structured symptom questions before they book the next step.',
    ],
    primaryCta: 'Join early access',
    problemHeadline: 'Before looking for a repairer, understand what kind of help you may need',
    problemIntro: [
      'Calling the wrong trade wastes time. Treating a serious issue as a small job, or a small job as an emergency, both create avoidable cost.',
    ],
    without: [
      'You may call the wrong trade.',
      'A serious issue may be treated as a minor inconvenience.',
      'A simple issue may create unnecessary panic.',
    ],
    with: [
      'Answer structured symptom questions.',
      'Get a likely urgency category.',
      'See which trade may be appropriate.',
      'Get a sensible next action.',
    ],
    inputs: [
      { label: 'What you can see', why: 'The visible symptom is the starting point.' },
      { label: 'Where it is happening', why: 'The room or part of the building changes who may need to look at it.' },
      { label: 'When it started', why: 'A new leak and a long-standing crack are not the same situation.' },
      { label: 'Whether it is getting worse', why: 'A problem that is spreading usually needs faster attention.' },
      { label: 'Other symptoms', why: 'Related signs help narrow the likely trade.' },
    ],
    outputs: [
      { label: 'Likely urgency', detail: 'A category for how soon the issue may need attention.' },
      { label: 'Possible trade', detail: 'The kind of professional who may need to inspect it.' },
      { label: 'Suggested next step', detail: 'A practical action, not a finished diagnosis.' },
      {
        label: 'Safety warning where needed',
        detail:
          'If there is immediate danger — fire, a serious electrical hazard, structural movement, a gas smell or another emergency — seek the appropriate emergency or qualified help. Do not wait for this tool.',
      },
    ],
    trustLine: 'This is not an on-site diagnosis.',
    trustDetail:
      'The tool does not replace a professional inspection. It does not diagnose structural, electrical, gas or other dangerous conditions with certainty.',
    steps: [
      { title: 'Describe the problem', detail: 'Say what you, or someone at the property, can see.' },
      { title: 'Answer follow-up questions', detail: 'The questions stay with the symptoms, not with a guess.' },
      { title: 'Review urgency and trade', detail: 'See how soon it may need attention and who may need to inspect it.' },
      {
        title: 'Arrange the next step',
        detail: 'Book a tracked repair on BuildMyHouse, or call the right professional, when you are ready.',
      },
    ],
    journeyWhy: 'Understand the problem first, then book the repair and keep the scope and price clearer.',
    journey: [
      { slug: 'property-repair-triage' },
      { title: 'Book a tracked repair', href: '/start/repair', tagline: 'Start a tracked repair on BuildMyHouse.', live: true },
      { slug: 'contract-builder-small-repairs' },
      { slug: 'price-checker' },
    ],
    homeowner:
      'Useful for homeowners, landlords, property managers, and Nigerians abroad whose family reports a problem at the house.',
    professional:
      'Repair coordinators and property managers may use it to collect clearer first-line information before dispatching a technician. It does not replace that inspection.',
    waitlistHeading: 'Know who to call before you start calling everybody',
    waitlistCopy: 'Join the early-access list for the Property Repair Triage Assistant.',
    preview: {
      kicker: 'Example — not a professional diagnosis',
      title: 'Repair guidance',
      illustrative: true,
      lines: [
        { label: 'Issue', value: 'Water appearing near a bathroom wall' },
        { label: 'Urgency', value: 'Needs attention soon' },
        { label: 'Likely trade', value: 'Plumbing inspection' },
        { label: 'Next step', value: 'Limit further water exposure where it is safe, then arrange an inspection' },
      ],
    },
    faq: [
      {
        q: 'Can this tool tell me exactly what is wrong?',
        a: 'No. It provides preliminary guidance based on the symptoms you describe. A professional may still need to inspect the property.',
      },
      {
        q: 'Will it tell me whether I need a plumber or an electrician?',
        a: 'The planned tool is designed to suggest the most likely trade based on the information provided.',
      },
      {
        q: 'Can I use it for urgent problems?',
        a: 'You can use the tool for guidance, but immediate hazards should be handled through the appropriate emergency or qualified professional service without delay.',
      },
      {
        q: 'Can I book a repair after using the tool?',
        a: 'Yes. BuildMyHouse already has a tracked repair flow. You can start one at Book a tracked repair when you know the next step.',
      },
      {
        q: 'Can Nigerians abroad use it for a family property?',
        a: 'Yes. Someone at the property can describe the symptoms while the owner uses the information to make a more informed next decision.',
      },
    ],
    extraLinks: [{ label: 'Tenant Maintenance Request Portal', href: '/tools/tenant-maintenance-request-portal' }],
  },
  'land-purchase-risk-checker': {
    seoTitle: 'Land Purchase Risk Checker Nigeria | BuildMyHouse',
    seoDescription:
      'Review ownership, survey and approval questions before buying land in Nigeria and generate a structured list of risks that need further verification.',
    eyebrow: 'Before buying',
    outcome: 'Ask better questions before paying for land in Nigeria.',
    supporting: [
      'A beautiful site inspection or a convincing seller is not enough to prove that a land transaction is safe.',
      'Before paying, a buyer needs to understand what is known and what has not yet been verified. This checker is being built to walk through ownership, documents, survey information, approvals and seller information, then show where further checking may be needed.',
    ],
    primaryCta: 'Join early access',
    problemHeadline: 'The biggest risk may be the question you never asked',
    problemIntro: [
      'People can spend money before they understand what still needs a lawyer, a surveyor or a registry check.',
    ],
    without: [
      'Important documents can be overlooked.',
      'Buyers may rely too heavily on the seller’s explanation.',
      'Survey or approval issues may not be questioned early.',
      'Money can move before anyone lists what still needs professional verification.',
    ],
    with: [
      'Walk through important ownership questions.',
      'Review survey and approval information.',
      'Identify missing information.',
      'Leave with a clearer checklist of what needs independent verification.',
    ],
    inputs: [
      { label: 'Ownership information', why: 'What evidence has the seller provided?' },
      { label: 'Survey information', why: 'Is there a survey plan or other location information?' },
      { label: 'Approval and planning', why: 'What is known about the land’s planning status?' },
      { label: 'Seller information', why: 'Who is selling, and in what capacity?' },
      { label: 'What you have been asked to do', why: 'What have you been asked to sign or pay?' },
    ],
    outputs: [
      { label: 'Land risk report', detail: 'A structured view of what you know and what is still open.' },
      { label: 'Areas needing verification', detail: 'Ownership, survey, approval and seller questions that are not settled.' },
      { label: 'Missing-information checklist', detail: 'Documents or answers that have not been provided.' },
      {
        label: 'Suggested professional step',
        detail: 'Who should review the matter next. The tool does not complete that review itself.',
      },
    ],
    trustLine: 'Questionnaire answers cannot make land “safe”.',
    trustDetail:
      'This tool does not verify title by itself. It is not legal advice. It does not replace a property lawyer, a registered surveyor, government registry checks or required planning checks. It does not search government land records.',
    steps: [
      { title: 'Say what you know', detail: 'Start with the land, the seller and the documents you have already seen.' },
      { title: 'Answer ownership and survey questions', detail: 'The questions are there so gaps are harder to skip.' },
      { title: 'Review the open risks', detail: 'See which areas still need independent checking.' },
      { title: 'Take it to a professional', detail: 'Use the report with a lawyer or surveyor before you commit money.' },
    ],
    journeyWhy: 'Check the paperwork and the open risks first. Then decide whether the land should even move into building plans.',
    journey: [
      { slug: 'property-document-checklist' },
      { slug: 'land-purchase-risk-checker' },
      { slug: 'survey-plan-review-request' },
      { slug: 'nigeria-building-cost-planner' },
    ],
    homeowner:
      'Useful for land buyers, including Nigerians abroad buying remotely, and people buying family or investment land.',
    professional:
      'Property lawyers, surveyors and agents may use the tool as a client-education layer so buyers arrive with better questions. It does not replace them.',
    waitlistHeading: 'Do more than ask, “Is the land genuine?”',
    waitlistCopy: 'Join the early-access list for the Land Purchase Risk Checker.',
    preview: {
      kicker: 'Example — not legal advice',
      title: 'Land risk review',
      illustrative: true,
      lines: [
        { label: 'Ownership evidence', value: 'Needs verification' },
        { label: 'Survey information', value: 'Provided' },
        { label: 'Planning / approval', value: 'Unknown' },
        { label: 'Seller identity', value: 'Information incomplete' },
        { label: 'Recommended next step', value: 'Independent professional document review' },
      ],
    },
    faq: [
      {
        q: 'Can this tool confirm that land is genuine?',
        a: 'No. It helps identify information and risk areas that need further verification.',
      },
      {
        q: 'Do I still need a lawyer?',
        a: 'Yes, where legal verification is required. The tool is not a substitute for professional legal due diligence.',
      },
      {
        q: 'Do I still need a surveyor?',
        a: 'A registered surveyor may be necessary to verify survey and location information.',
      },
      {
        q: 'Can Nigerians abroad use the tool?',
        a: 'Yes. It can help a remote buyer organise the questions that need answers before committing money.',
      },
      {
        q: 'Will the checker search government land records?',
        a: 'No. Registry verification has to be handled separately. The checker does not search government land records.',
      },
    ],
  },
  'milestone-payment-schedule': {
    seoTitle: 'Construction Payment Schedule Builder Nigeria | BuildMyHouse',
    seoDescription:
      'Plan building and renovation payments stage by stage, including what comes next, what proof to request and what money should remain.',
    eyebrow: 'Free project planning tool',
    outcome: 'Plan your building or renovation payments stage by stage instead of letting money move ahead of the work.',
    supporting: [
      'A project can become difficult when the payment plan is unclear.',
      'This free tool helps you organise project stages, stage amounts, evidence expectations and the money that should remain, before the next payment conversation begins.',
    ],
    primaryCta: 'Build my payment schedule',
    secondaryCta: 'See an example',
    timeNote: 'About a minute. No sign-up required.',
    problemHeadline: 'Do not let your payments move faster than your project',
    problemIntro: [
      'Paying for construction is not only about the total price. Another important question is what should be completed before the next part of the money moves.',
    ],
    without: [
      'Large amounts can move without a clear connection to completed work.',
      'You may not know what the next payment is meant to cover.',
      'It becomes difficult to see how much money should remain for later stages.',
    ],
    with: [
      'Break the work into stages.',
      'Connect money to those stages.',
      'See what proof to request.',
      'Keep sight of what should remain for future work.',
    ],
    inputs: [
      {
        label: 'Project type',
        why: 'New build, renovation or interior design. The planner uses the type you choose.',
      },
      {
        label: 'Total budget and currency',
        why: 'The overall money for this project, in naira or another supported currency.',
      },
      {
        label: 'Stages',
        why: 'How many stages, what each one is called, and the percentage or amount for that stage.',
      },
      {
        label: 'Contingency',
        why: 'A percentage set aside for reasonable surprises, hidden defects or price changes.',
      },
    ],
    outputs: [
      { label: 'Stage-by-stage plan', detail: 'What comes next, in the order you set.' },
      { label: 'How much to pay', detail: 'The amount attached to each stage.' },
      { label: 'What proof to request', detail: 'Evidence to ask for before that stage is treated as done.' },
      { label: 'What should remain', detail: 'How much of the project money is still ahead of you.' },
    ],
    trustLine: 'This is a planning tool.',
    trustDetail:
      'It is not a contract, a professional valuation, a certificate of completion, or legal advice. It does not replace a formal payment certificate, a bill of quantities, or contract administration.',
    steps: [
      { title: 'Choose the project type', detail: 'New build, renovation or interior design.' },
      { title: 'Add the project information', detail: 'Budget, stages, amounts and contingency.' },
      { title: 'Generate the payment schedule', detail: 'The planner turns those inputs into a stage plan.' },
      { title: 'Use it in the next conversation', detail: 'Take the schedule into the discussion about the next payment.' },
    ],
    journeyWhy: 'Set a budget direction, then organise how payments should move as the work progresses.',
    journey: [
      { slug: 'renovation-budget-planner' },
      { slug: 'nigeria-building-cost-planner' },
      { slug: 'milestone-payment-schedule' },
      { slug: 'remote-site-progress-tracker' },
      { slug: 'independent-stage-verification' },
    ],
    homeowner:
      'Use it before or during a construction or renovation project when you want a clearer structure for discussing money and progress, including from another city or country.',
    professional:
      'Quantity surveyors, architects, project managers and contractors may use it as a simple client-education tool. It does not replace a formal payment certificate.',
    waitlistHeading: 'Create your payment schedule before the next payment is due',
    waitlistCopy: 'The planner is ready to use. You can also ask to hear about new BuildMyHouse tools.',
    preview: {
      kicker: 'Example of the schedule layout',
      title: 'Payment schedule',
      illustrative: true,
      lines: [
        { label: 'Stage', value: 'The name you give that part of the work' },
        { label: 'Amount', value: 'The share of the budget you assign' },
        { label: 'Proof to request', value: 'What you want to see before the next payment' },
        { label: 'Still ahead', value: 'Money that should remain for later stages' },
      ],
    },
    faq: [
      {
        q: 'What is a milestone payment schedule?',
        a: 'It divides a project into stages and connects payments to those stages.',
      },
      {
        q: 'Why pay contractors in stages?',
        a: 'It can make it easier to understand what each payment is intended to cover and what money remains for future work.',
      },
      {
        q: 'Can Nigerians abroad use it?',
        a: 'Yes. It can provide a simple framework for discussing progress and payment from a distance.',
      },
      {
        q: 'Does it certify that work is complete?',
        a: 'No.',
      },
      {
        q: 'Is the schedule a legal contract?',
        a: 'No.',
      },
      {
        q: 'Should a quantity surveyor or architect still be involved?',
        a: 'For projects that need professional cost advice or stage certification, yes.',
      },
    ],
    education: [
      {
        heading: 'Why stage payments matter when building in Nigeria',
        paragraphs: [
          'Paying for construction is not only about the total contract price.',
          'Another important question is: what should be completed before the next part of the money moves?',
          'A stage-payment plan gives both sides a clearer framework. This is particularly useful for Nigerians abroad who cannot visit the site every week.',
          'The schedule does not replace professional supervision. It helps organise the money conversation around clearly defined stages.',
        ],
      },
    ],
  },
  'renovation-budget-planner': {
    seoTitle: 'Renovation Budget Planner Nigeria | BuildMyHouse',
    seoDescription:
      'Plan a Nigerian renovation by rooms, work depth, finish level, location and contingency before collecting contractor quotations.',
    eyebrow: 'Free renovation planning tool',
    outcome: 'Get a clearer renovation budget direction before you start asking contractors for prices.',
    supporting: [
      'A renovation budget is more than one contractor’s total.',
      'The cost depends on which rooms are changing, how much work they need, the finish level, the property location and a reasonable contingency. Use this planner to organise those decisions first.',
    ],
    primaryCta: 'Plan my renovation budget',
    timeNote: 'About a minute. No sign-up required.',
    problemHeadline: 'Your contractor’s quote is not your renovation budget',
    problemIntro: [
      'Two people may both say “renovate this house” while imagining completely different work. One expects painting and tile changes. Another expects plumbing replacement, electrical work, ceilings, bathrooms and new finishes.',
      'A useful budget starts with defining the work.',
    ],
    without: [
      'The scope may remain vague.',
      'Different contractors can price different jobs.',
      'Finishes may be discussed too late.',
      'Unexpected work may have no planning allowance.',
    ],
    with: [
      'Define the rooms.',
      'Choose the depth of work.',
      'Choose the finish level.',
      'Consider location.',
      'Include contingency.',
    ],
    inputs: [
      {
        label: 'Property and rooms',
        why: 'Property type, size, and the spaces you want to change. One bathroom and an entire house are very different projects.',
      },
      {
        label: 'Depth of work',
        why: 'Repairs, an upgrade, or a full redo. A light refresh is different from deeper renovation.',
      },
      {
        label: 'Finish level',
        why: 'Basic, mid-range or premium. Different specifications and products can have very different costs.',
      },
      {
        label: 'Location',
        why: 'The planner supports Lagos, Abuja and Other Nigeria, because costs can differ by market, labour and transport.',
      },
      {
        label: 'Contingency',
        why: 'Money reserved for reasonable unexpected work. Renovations can reveal problems that were not visible beforehand.',
      },
    ],
    outputs: [
      { label: 'Rough budget direction', detail: 'A planning range for the rooms and work you selected. Not a contractor quotation.' },
      { label: 'A clearer scope', detail: 'What is being renovated, and how deep that work is.' },
      { label: 'Finish expectations', detail: 'Basic, mid-range or premium, stated before quotes arrive.' },
      { label: 'Contingency', detail: 'An allowance for reasonable surprises.' },
      {
        label: 'Renovation scope worksheet',
        detail: 'The existing downloadable worksheet is still available if you want to write the scope down.',
      },
    ],
    trustLine: 'Not a final contractor quotation.',
    trustDetail:
      'A detailed inspection, a written scope, drawings and professional input may change the final cost.',
    steps: [
      { title: 'Choose the spaces', detail: 'Mark the rooms and areas that are actually changing.' },
      { title: 'Describe the depth of work', detail: 'Repairs, upgrade or a full redo in each space.' },
      { title: 'Choose finish, location and contingency', detail: 'Lagos, Abuja or Other Nigeria, plus a finish level and a reserve.' },
      { title: 'Review the budget direction', detail: 'Use it before you ask contractors to price the work.' },
    ],
    journeyWhy: 'Define the renovation, check important prices, compare quotations against the same scope, and then plan stage payments.',
    journey: [
      { slug: 'renovation-budget-planner' },
      { slug: 'price-checker' },
      { slug: 'scope-of-work-generator' },
      { slug: 'contractor-quote-comparison' },
      { slug: 'milestone-payment-schedule' },
    ],
    homeowner:
      'Useful if you are renovating your own house, a parent’s house, an inherited house, a rental, or a property that was left unfinished — including before relatives or contractors start pricing the work.',
    professional:
      'Architects, interior designers and quantity surveyors may use the planner as an early client-briefing tool. It does not replace a professional estimate.',
    waitlistHeading: 'Plan the renovation before the quotations start',
    waitlistCopy: 'The planner is ready to use. You can also ask to hear about new BuildMyHouse tools.',
    preview: {
      kicker: 'Example of the planner result',
      title: 'Renovation budget direction',
      illustrative: true,
      lines: [
        { label: 'Spaces', value: 'The rooms you selected' },
        { label: 'Work depth', value: 'Repairs, upgrade or full redo' },
        { label: 'Finish', value: 'Basic, mid-range or premium' },
        { label: 'Location', value: 'Lagos, Abuja or Other Nigeria' },
        { label: 'Contingency', value: 'A reserve for reasonable surprises' },
      ],
    },
    faq: [
      {
        q: 'How much does it cost to renovate a house in Nigeria?',
        a: 'There is no single price. Cost depends on property size, condition, location, scope, finish level and current market conditions.',
      },
      {
        q: 'Is this result a contractor quote?',
        a: 'No.',
      },
      {
        q: 'Can I use it for Lagos?',
        a: 'Yes. The live planner lets you choose Lagos, Abuja or Other Nigeria.',
      },
      {
        q: 'Can Nigerians abroad use it?',
        a: 'Yes.',
      },
      {
        q: 'Why does finish level matter?',
        a: 'Different specifications and products can have very different costs.',
      },
      {
        q: 'What is renovation contingency?',
        a: 'Money reserved for reasonable unexpected work or changes.',
      },
      {
        q: 'What should I do after using the planner?',
        a: 'Refine the scope, arrange an inspection where appropriate, check important prices with Price Checker, and compare quotations against the same scope.',
      },
    ],
    education: [
      {
        heading: 'How to budget for a house renovation in Nigeria',
        steps: [
          { title: 'Define what you want to change', detail: 'Name the rooms and the work, before anyone gives you a total.' },
          { title: 'Separate repairs from upgrades', detail: 'Fixing a leak is not the same job as changing the finishes.' },
          { title: 'Choose a finish level', detail: 'Basic, mid-range or premium will not price the same.' },
          { title: 'Inspect the property', detail: 'An existing house can hide problems that a guess will miss.' },
          {
            title: 'Check important material prices',
            detail: 'Use Price Checker for materials that will move the budget.',
          },
          { title: 'Allow for contingency', detail: 'Keep a reserve for reasonable surprises.' },
          {
            title: 'Compare contractors on the same scope',
            detail: 'The Contractor Quote Comparison Tool is being built for this. Until then, ask each contractor to price the same written list.',
          },
          {
            title: 'Plan stage payments before work begins',
            detail: 'Use the Milestone Payment Schedule Builder so money follows the work.',
          },
        ],
      },
      {
        heading: 'Why renovation costs can change after work starts',
        paragraphs: [
          'Renovations often involve existing buildings. Some problems stay hidden until work begins.',
          'Examples include old plumbing, electrical problems, damaged finishes, hidden moisture, and changes requested by the owner.',
          'That is why an early planner should be treated as budget direction, not a final quotation. A serious renovation should normally be inspected before the final price is agreed.',
        ],
      },
    ],
    extraLinks: [
      { label: 'Download the renovation scope worksheet', href: '/downloads/remote-renovation-scope-worksheet' },
      { label: 'Start a tracked project', href: '/start' },
    ],
  },
};

export const BATCH_1_SLUGS = Object.keys(pages);

export function getBatch1Page(slug: string): ToolPageCopy | undefined {
  return pages[slug];
}

export function faqsFor(page: ToolPageCopy): ToolPageFaq[] {
  const rest = page.faq.filter((item) => item.q !== MONEY_FAQ.q);
  return [...rest, MONEY_FAQ];
}

export const DEDICATED_TOOL_ROUTES = new Set([
  'price-checker',
  'milestone-payment-schedule',
  'renovation-budget-planner',
]);

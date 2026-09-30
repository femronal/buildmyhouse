import type { ToolPageCopy } from '@/lib/tools/batch-1-pages';

const EXAMPLE_NOTE =
  'This sample shows the shape of a future result. It is an example, not a real report, and it is not professional, legal, or government advice.';

const pages: Record<string, ToolPageCopy> = {
  'property-document-checklist': {
    seoTitle: 'Property Documents Checklist Nigeria | BuildMyHouse',
    seoDescription:
      'Get a location-aware checklist of property documents to ask for before buying land or property in Nigeria.',
    eyebrow: 'Before buying',
    outcome: 'Know which property documents to ask for before you move deeper into a land or property purchase.',
    supporting: [
      'Buying property can become confusing very quickly. The seller says the documents are complete. The agent says everything is fine. Someone sends you several PDFs on WhatsApp.',
      'The important question is: what documents should actually exist for this type of property and this location?',
      'This tool is being built to generate a clearer document checklist based on where the property is located and what you are trying to buy.',
    ],
    primaryCta: 'Join the early-access list',
    problemHeadline: '“Documents complete” does not tell you which documents you should actually see',
    problemIntro: [
      'A pile of files is not the same as a complete set. You can receive several documents and still be missing the ones that matter for that location and that kind of purchase.',
    ],
    without: [
      'You may not know what to request.',
      'A seller can send many documents without explaining what each one proves.',
      'Important information can be missing without you realising.',
      'A document can exist without proving everything you assume it proves.',
    ],
    with: [
      'Start with a structured checklist.',
      'Understand why each item may matter.',
      'See what information is still missing.',
      'See which items still need a lawyer, surveyor, or official check.',
    ],
    inputs: [
      {
        label: 'Location',
        why: 'What you should ask for can differ by state and by the kind of transaction. The checklist is meant to be location-aware once that logic is built and checked.',
      },
      {
        label: 'Property type',
        why: 'Land, a completed house, an apartment, or another supported type can involve different documents.',
      },
      {
        label: 'Seller type',
        why: 'An individual, a company, or a family sale can change what you should check about the seller’s authority to sell.',
      },
      {
        label: 'What you already have',
        why: 'The point is to show gaps, not to tell you to request documents you already received.',
      },
    ],
    outputs: [
      { label: 'A structured document checklist', detail: 'A list of items to ask about for this kind of purchase.' },
      { label: 'Why each item matters', detail: 'A plain explanation, not a legal opinion.' },
      { label: 'Missing-information indicators', detail: 'What you have not yet seen or confirmed.' },
      { label: 'Items for a lawyer or surveyor', detail: 'Questions that still need an independent professional.' },
      { label: 'A next-step list', detail: 'What to do before you treat the paperwork as settled.' },
    ],
    trustLine: 'A checklist is not proof that a document is genuine.',
    trustDetail:
      'This tool does not confirm ownership. It does not replace a property lawyer, a registered surveyor, an official registry check, or the planning checks a project may still need.',
    steps: [
      { title: 'Tell us what you are buying', detail: 'Land, a house, or another supported property type.' },
      { title: 'Tell us where it is', detail: 'The location is what makes the checklist relevant.' },
      { title: 'Tell us what you already have', detail: 'So the list can focus on what is still missing.' },
      { title: 'Review what still needs attention', detail: 'Then take those items to the right professional.' },
    ],
    journeyWhy:
      'Know what paperwork should exist, then look at ownership, survey, and planning questions before you move toward construction.',
    journey: [
      { slug: 'property-document-checklist' },
      { slug: 'land-purchase-risk-checker' },
      { slug: 'survey-plan-review-request' },
      { slug: 'building-approval-navigator' },
      { slug: 'nigeria-building-cost-planner' },
    ],
    homeowner:
      'Useful when an agent, relative, or seller sends you documents and you are not sure the important pieces are actually there.',
    professional:
      'Property lawyers, surveyors, and agents can use it as an educational checklist with clients. It does not replace their professional review.',
    waitlistHeading: 'Stop guessing which documents you should be asking for',
    waitlistCopy: 'Join the early-access list for the Property Document Checklist Generator.',
    preview: {
      kicker: 'Example — not legal advice',
      title: 'Document checklist',
      illustrative: true,
      note: EXAMPLE_NOTE,
      lines: [
        { label: 'Proof of ownership', value: 'Ask seller' },
        { label: 'Survey information', value: 'Ask seller' },
        { label: 'Planning / approval documents', value: 'May be relevant' },
        { label: 'Seller identification', value: 'Confirm' },
        { label: 'Independent legal review', value: 'Recommended' },
      ],
    },
    faq: [
      {
        q: 'What documents do I need before buying land in Nigeria?',
        a: 'The documents can depend on the location, the ownership history, and the type of transaction. This tool is being built to help organise the questions. It does not replace a lawyer’s review.',
      },
      {
        q: 'Can this tool confirm that a document is genuine?',
        a: 'No. A checklist tells you what to look for. Whether a document is genuine may still need an independent professional and an official check.',
      },
      {
        q: 'Do I still need a property lawyer?',
        a: 'Yes, where legal due diligence is required. The checklist is a starting list, not a legal opinion.',
      },
      {
        q: 'Can Nigerians abroad use this?',
        a: 'Yes. It can help you organise what to request before you rely only on documents sent through WhatsApp or email.',
      },
      {
        q: 'Will the checklist be different by state?',
        a: 'That is the intention. This page does not claim a specific state’s document list until that logic is built and checked.',
      },
    ],
  },
  'survey-plan-review-request': {
    seoTitle: 'Survey Plan Review Request Nigeria | BuildMyHouse',
    seoDescription:
      'Send a survey plan for review by a registered surveyor and request checks around coordinates, location and apparent legitimacy.',
    eyebrow: 'Land and survey tool',
    outcome: 'Route a survey plan to the right professional before you rely on it.',
    supporting: [
      'A survey plan can contain coordinates, measurements, location information, and professional details that many buyers do not know how to read.',
      'This tool is being built so you can submit a survey plan and request a review by a registered surveyor.',
      'The surveyor makes the technical judgement. The software does not.',
    ],
    primaryCta: 'Join the early-access list',
    problemHeadline: 'A survey plan can look official and still need a professional to check it',
    problemIntro: [
      'Receiving a survey plan is not the same as understanding it. Coordinates, the described location, and the surveyor’s details can all need a trained eye.',
    ],
    without: [
      'You may receive a plan and have no way to read it.',
      'The coordinates may never be checked by someone qualified.',
      'You may not know which professional should review it.',
      'The file can sit in WhatsApp until money has already moved.',
    ],
    with: [
      'Put the plan into a structured review request.',
      'The request is meant to go to a registered surveyor.',
      'Ask for comments on the coordinates and the location.',
      'Get the surveyor’s result back as a professional comment, not a software verdict.',
    ],
    inputs: [
      { label: 'Survey plan', why: 'The document the surveyor would review. Supported file types will be listed when the tool opens.' },
      { label: 'Property location', why: 'So the review can be read against the place you were told the land is.' },
      { label: 'Basic transaction context', why: 'A short note on whether you are buying, already own the land, or were sent the plan by someone else.' },
      { label: 'Contact details', why: 'So the review result can be returned to you. Do not add extra personal documents the review does not need.' },
    ],
    outputs: [
      { label: 'A structured review request', detail: 'The plan and the basic facts, organised for a surveyor.' },
      { label: 'Review status', detail: 'Whether a registered surveyor has been asked, and whether the review is still pending.' },
      { label: 'Surveyor comments', detail: 'Comments on the plan, coordinates, or location, where the surveyor includes them.' },
      { label: 'Issues to investigate', detail: 'Points the surveyor says still need more work.' },
      { label: 'A recommended next step', detail: 'What to do after the professional review, not a claim that the land is yours.' },
    ],
    trustLine: 'The software does not verify survey coordinates.',
    trustDetail:
      'The intended path is: you submit the plan, a registered surveyor reviews it, and you receive that professional’s result. A survey review does not prove you own the land.',
    steps: [
      { title: 'Submit the survey plan', detail: 'Send the plan you were given, once upload is available.' },
      { title: 'Add the basic property facts', detail: 'Location and a short note on the transaction.' },
      { title: 'The request goes to a registered surveyor', detail: 'A person makes the technical judgement.' },
      { title: 'Read the review when it is done', detail: 'There is no promised turnaround time on this page.' },
    ],
    journeyWhy: 'After you know which documents to ask for, a survey plan is one of the items a registered surveyor should read before you design or price a project.',
    journey: [
      { slug: 'property-document-checklist' },
      { slug: 'land-purchase-risk-checker' },
      { slug: 'survey-plan-review-request' },
      { slug: 'plot-to-project-feasibility' },
      { slug: 'nigeria-building-cost-planner' },
    ],
    homeowner:
      'Useful before you rely on a survey plan you do not fully understand, including when the only copy you have is a PDF or photo sent from Nigeria.',
    professional:
      'Registered surveyors may later receive structured review requests through this workflow. The page does not say that service is open today.',
    waitlistHeading: 'Have a survey plan but don’t know what it really tells you?',
    waitlistCopy: 'Join the early-access list for structured professional survey-plan review.',
    preview: {
      kicker: 'Example — not a real survey review',
      title: 'Review request',
      illustrative: true,
      note: EXAMPLE_NOTE,
      lines: [
        { label: 'Survey plan uploaded', value: 'Received' },
        { label: 'Coordinate review', value: 'Pending surveyor' },
        { label: 'Location consistency', value: 'Pending surveyor' },
        { label: 'Surveyor details', value: 'Pending review' },
        { label: 'Professional comments', value: 'Not yet available' },
      ],
    },
    faq: [
      {
        q: 'Can BuildMyHouse verify a survey plan automatically?',
        a: 'No. The intended tool sends the plan to a registered surveyor for review. The software does not decide that a survey is genuine.',
      },
      {
        q: 'What will the surveyor check?',
        a: 'The planned review can cover the survey information, the coordinates, and whether the plan appears consistent. The exact scope depends on the professional service.',
      },
      {
        q: 'Does a reviewed survey plan prove I own the land?',
        a: 'No. Ownership and title are separate legal questions.',
      },
      {
        q: 'Do I still need a lawyer?',
        a: 'You may. A survey review does not replace legal due diligence.',
      },
      {
        q: 'Can I submit a survey sent to me on WhatsApp?',
        a: 'Only file types the tool actually accepts should be used, and those will be listed when upload opens. This page does not ask you to send original documents through an unsecured chat.',
      },
    ],
  },
  'building-approval-navigator': {
    seoTitle: 'Building Approval Navigator Nigeria | BuildMyHouse',
    seoDescription:
      'Understand likely building approval documents and steps based on your Nigerian state and project type before construction begins.',
    eyebrow: 'Approval and compliance tool',
    outcome: 'Understand the likely approval journey before you start building.',
    supporting: [
      'Many people buy land and move straight to drawings, blocks, and contractors. Then somebody asks, “Where is the approval?”',
      'The Building Approval Navigator is being built to explain the likely documents, professionals, and steps that may apply based on your state and project type.',
      'It is guidance. It is not government approval.',
    ],
    primaryCta: 'Join early access',
    problemHeadline: 'Do not discover approval requirements after construction has already started',
    problemIntro: [
      'Approval questions are easier to handle before blocks are on the ground. Rules and the office you deal with can differ from one state to another.',
    ],
    without: [
      'You may not know which authority is relevant.',
      'Drawings or documents may be prepared too late.',
      'Requirements in one state can be confused with another.',
      'Informal advice can stand in for the current process.',
    ],
    with: [
      'Start with the project’s location.',
      'See likely documents and stages.',
      'See which professionals may be involved.',
      'See what you still need to confirm with the responsible authority.',
    ],
    inputs: [
      { label: 'State or location', why: 'Approval paths are not the same across Nigeria.' },
      { label: 'Project type', why: 'A new building, an alteration, or a renovation can raise different questions.' },
      { label: 'Land or property status', why: 'What you already have can change which step comes first.' },
      { label: 'Basic project scale', why: 'Only if the finished tool needs it to explain the likely path. This page does not invent a size rule.' },
    ],
    outputs: [
      { label: 'A likely approval pathway', detail: 'An early map of steps, marked as something to confirm.' },
      { label: 'Possible documents', detail: 'Papers that may be needed. Not a government checklist.' },
      { label: 'Professionals who may be involved', detail: 'Such as an architect or another planning professional.' },
      { label: 'Questions for the authority', detail: 'What to confirm before you treat any step as settled.' },
      { label: 'A next-step checklist', detail: 'What to do before work starts.' },
    ],
    trustLine: 'Guidance is not an approval.',
    trustDetail:
      'Planning rules change. BuildMyHouse does not issue building approval, and this tool does not connect to a government system.',
    steps: [
      { title: 'Choose the project’s location', detail: 'State and place come first.' },
      { title: 'Describe the type of work', detail: 'New build, alteration, renovation, or another supported category.' },
      { title: 'Review the likely journey', detail: 'Documents, people, and steps that may apply.' },
      { title: 'Confirm before you proceed', detail: 'Check the current requirements with the authority or a qualified professional.' },
    ],
    journeyWhy: 'Approval questions sit between the land paperwork and the decision to mobilise a project.',
    journey: [
      { slug: 'property-document-checklist' },
      { slug: 'land-purchase-risk-checker' },
      { slug: 'building-approval-navigator' },
      { slug: 'plot-to-project-feasibility' },
      { slug: 'project-readiness-score' },
    ],
    homeowner: 'Useful before you start, when you are not sure which approvals may apply.',
    professional:
      'Architects and planning professionals can use it as a starting point when explaining the journey to a client. It does not replace their work or an authority’s decision.',
    waitlistHeading: 'Know the approval questions before work begins',
    waitlistCopy: 'Join the early-access list for the Building Approval Navigator.',
    preview: {
      kicker: 'Example — requirements must be confirmed',
      title: 'Possible steps',
      illustrative: true,
      note: EXAMPLE_NOTE,
      lines: [
        { label: 'Project', value: 'Residential building' },
        { label: 'Location', value: 'Example state' },
        { label: 'Planning documentation', value: 'Check required' },
        { label: 'Professional drawings', value: 'May be required' },
        { label: 'Submission and inspection', value: 'Depends on the authority' },
      ],
    },
    faq: [
      {
        q: 'Do I need building approval in Nigeria?',
        a: 'It depends on the location and the type of project. The Navigator is meant to help you see likely steps. Confirm the current requirements with the relevant authority.',
      },
      {
        q: 'Can BuildMyHouse obtain approval for me?',
        a: 'No. This tool is for guidance. It does not submit an application or receive approval from government.',
      },
      {
        q: 'Will Lagos requirements be listed?',
        a: 'Only after they have been checked and built into the tool. This page does not publish a Lagos requirement list.',
      },
      {
        q: 'Does the tool replace an architect?',
        a: 'No.',
      },
      {
        q: 'Are approval rules the same across Nigeria?',
        a: 'No. The process and the documents can vary by state and by project.',
      },
    ],
  },
  'pre-purchase-property-inspection': {
    seoTitle: 'Pre-Purchase Property Inspection Nigeria | BuildMyHouse',
    seoDescription:
      'Guide a property inspection through structure, roofing, plumbing and electrical checks before you commit to buying a house.',
    eyebrow: 'Before buying',
    outcome: 'Look beyond paint, tiles, and staging before buying a property.',
    supporting: [
      'A house can look beautiful during a viewing and still have problems that are expensive to fix later. Roofing. Plumbing. Electrical work. Cracks. Drainage. Moisture.',
      'The Pre-Purchase Property Inspection App is being built to guide an inspection through the same checks each time, before the buyer commits.',
      'It is a structured inspection workflow. It is not a substitute for a qualified professional where one is required.',
    ],
    primaryCta: 'Join early access',
    problemHeadline: 'The best time to find a defect is before the property becomes yours',
    problemIntro: [
      'A short viewing often follows the finishes. The systems that cost money later can be skipped, forgotten, or described differently by each person who walks through.',
    ],
    without: [
      'Viewings focus heavily on how the house looks.',
      'Different people may check different things.',
      'Small warning signs are easy to forget after you leave.',
      'You may negotiate before you understand the repair exposure.',
    ],
    with: [
      'Inspect with a consistent checklist.',
      'Record issues by building system.',
      'Attach photos where the tool supports them.',
      'Keep the findings together before you decide.',
    ],
    inputs: [
      { label: 'Property details', why: 'So the report is about a specific house, not a generic checklist.' },
      { label: 'What you can see', why: 'The visible condition of each area, recorded in the same order.' },
      { label: 'Inspection answers', why: 'Structured responses so nothing important is left as a vague memory.' },
      { label: 'Photos and notes', why: 'Evidence and comments, where the product supports them. A photo is not a structural judgement.' },
    ],
    outputs: [
      { label: 'A structured inspection report', detail: 'Findings in one place.' },
      { label: 'Issues by system', detail: 'Structure, roofing, plumbing, electrical, and other approved categories.' },
      { label: 'Photos, where implemented', detail: 'Only if that upload is part of the finished tool.' },
      { label: 'Items for a specialist', detail: 'Concerns that need an engineer or another qualified person.' },
      { label: 'Recommended next actions', detail: 'What to review before you commit to the purchase.' },
    ],
    trustLine: 'The app organises findings. It does not declare a property safe.',
    trustDetail:
      'It does not replace a structural engineer or another specialist assessment where one is required. A physical inspection also says nothing about whether the title is sound.',
    steps: [
      { title: 'Start the inspection', detail: 'Open a record for that property.' },
      { title: 'Work through each area', detail: 'Follow the same checks, not only the rooms that look finished.' },
      { title: 'Record findings and evidence', detail: 'Notes, and photos where upload exists.' },
      { title: 'Review the report before you decide', detail: 'Use it in the purchase conversation. Do not treat it as a safety certificate.' },
    ],
    journeyWhy: 'If you are buying an existing building, the paperwork and the physical condition are separate questions.',
    journey: [
      { slug: 'land-purchase-risk-checker' },
      { slug: 'property-document-checklist' },
      { slug: 'pre-purchase-property-inspection' },
      { slug: 'renovation-budget-planner' },
      { slug: 'build-buy-or-renovate-calculator' },
    ],
    homeowner:
      'Useful before you buy an existing house, including when someone in Nigeria needs to inspect it properly instead of sending a few attractive videos.',
    professional:
      'Inspectors, engineers, and property consultants may use it to produce more consistent client reports. It does not replace their qualification.',
    waitlistHeading: 'Do more than walk through the house and say, “It looks fine”',
    waitlistCopy: 'Join the early-access list for the Pre-Purchase Property Inspection App.',
    preview: {
      kicker: 'Example inspection',
      title: 'Findings',
      illustrative: true,
      note: EXAMPLE_NOTE,
      lines: [
        { label: 'Roofing', value: 'Needs closer review' },
        { label: 'Plumbing', value: 'Issue recorded' },
        { label: 'Electrical', value: 'No obvious issue recorded' },
        { label: 'Structure', value: 'Professional opinion required' },
        { label: 'Next step', value: 'Review findings before you decide' },
      ],
    },
    faq: [
      {
        q: 'Why inspect a house before buying?',
        a: 'An inspection can record visible problems and show which areas need a deeper professional assessment before you commit.',
      },
      {
        q: 'Can the app detect structural defects automatically?',
        a: 'No. It does not judge structural safety from answers or photographs.',
      },
      {
        q: 'Who should carry out the inspection?',
        a: 'That depends on the property and the issues. Serious technical concerns should be handled by an appropriately qualified professional.',
      },
      {
        q: 'Can Nigerians abroad use it?',
        a: 'Yes. A person or professional at the property can follow the checks and share the findings with you.',
      },
      {
        q: 'Does a good inspection mean the title is safe?',
        a: 'No. The physical condition of a building and the legal ownership of the property are different questions.',
      },
    ],
  },
  'property-document-vault': {
    seoTitle: 'Property Document Vault Nigeria | BuildMyHouse',
    seoDescription:
      'Keep property titles, drawings, receipts, inspection records and agreements organised in one place instead of scattered chats and folders.',
    eyebrow: 'Property records tool',
    outcome:
      'Keep the documents that explain your property together, instead of buried across WhatsApp, email, and somebody else’s phone.',
    supporting: [
      'Property records accumulate slowly. A receipt today. A survey plan next month. Drawings later. An inspection report in somebody’s WhatsApp. An agreement saved on another phone.',
      'Years later, nobody remembers where anything is.',
      'The Property Document Vault is being built to keep important records organised around the property itself.',
    ],
    primaryCta: 'Join early access',
    problemHeadline: 'Your property’s paper trail should not disappear inside chat history',
    problemIntro: [
      'When several people hold different files, reconstructing what happened becomes a project of its own.',
    ],
    without: [
      'Receipts get mixed with everyday WhatsApp messages.',
      'Drawings can exist in several versions.',
      'Family members may each hold different documents.',
      'Years later it is hard to reconstruct what happened.',
    ],
    with: [
      'Organise records by property.',
      'Separate them into categories.',
      'Come back to the same place when you need a file.',
      'Build a clearer paper trail over time.',
    ],
    inputs: [
      { label: 'Property profile', why: 'The vault is organised around a property, not a general folder.' },
      { label: 'The document', why: 'The file you want to keep with that property.' },
      { label: 'Category', why: 'So a title, a drawing, a receipt, and an agreement are not dumped into one pile.' },
      { label: 'Date and a short description', why: 'So you can tell later what the file is, when you know those details.' },
    ],
    outputs: [
      { label: 'One organised property record', detail: 'The files you add, kept against that property.' },
      { label: 'Document categories', detail: 'Ownership papers, survey and plans, drawings, receipts, agreements, and inspection reports.' },
      { label: 'A place to return to', detail: 'When you need the property’s records again.' },
    ],
    trustLine: 'Storing a file does not mean BuildMyHouse has verified it.',
    trustDetail:
      'The vault is for organisation. It is not an official government record, and it does not prove that a document is genuine. This page does not claim a special security standard beyond the account protection BuildMyHouse already uses.',
    steps: [
      { title: 'Create or select the property', detail: 'Give the records a home.' },
      { title: 'Add the documents', detail: 'Only what you choose to store.' },
      { title: 'Organise them by category', detail: 'So the next search is not through a chat thread.' },
      { title: 'Return when you need them', detail: 'The record stays with the property.' },
    ],
    journeyWhy: 'A checklist tells you what to collect. A vault is where those records can live afterwards.',
    journey: [
      { slug: 'property-document-checklist' },
      { slug: 'property-document-vault' },
      { slug: 'project-readiness-score' },
      { slug: 'receipt-and-invoice-vault' },
      { slug: 'project-handover-pack' },
    ],
    homeowner:
      'Useful when several family members are involved and the records are already splitting across people in Nigeria and people abroad.',
    professional:
      'Lawyers, architects, and consultants can work more clearly when a client can point to an organised set of files. Sharing controls are not described here because they are not part of the tool yet.',
    waitlistHeading: 'Your property’s important documents deserve one home',
    waitlistCopy: 'Join the early-access list for the Property Document Vault.',
    preview: {
      kicker: 'Example vault',
      title: 'Property records',
      illustrative: true,
      note: 'These counts are an illustration of the layout. They are not anyone’s files.',
      lines: [
        { label: 'Ownership documents', value: '3 files' },
        { label: 'Survey and plans', value: '2 files' },
        { label: 'Drawings', value: '5 files' },
        { label: 'Receipts', value: '14 files' },
        { label: 'Agreements and inspections', value: '5 files' },
      ],
    },
    faq: [
      {
        q: 'What documents can I keep in the vault?',
        a: 'The planned categories include property titles, drawings, receipts, inspection records, and agreements.',
      },
      {
        q: 'Does storing a document mean BuildMyHouse has verified it?',
        a: 'No.',
      },
      {
        q: 'Can my family access the documents?',
        a: 'Not yet. This page does not promise family sharing. Access will only be described when that feature exists.',
      },
      {
        q: 'Is this a replacement for official government records?',
        a: 'No. Keeping a copy for yourself does not replace the record held by the relevant office.',
      },
      {
        q: 'Can I store construction receipts later?',
        a: 'Receipts are one of the planned categories. BuildMyHouse also has a separate Receipt and Invoice Vault on the roadmap. This page does not claim those tools are already connected.',
      },
    ],
  },
  'project-readiness-score': {
    seoTitle: 'Are You Ready to Build in Nigeria? | BuildMyHouse',
    seoDescription:
      'Review your land, drawings, budget, approvals and professional team before deciding whether your building project is ready to start.',
    eyebrow: 'Project planning tool',
    outcome: 'Find out what is ready, and what is still missing, before you rush onto site.',
    supporting: [
      'Owning land does not automatically mean the project is ready for construction.',
      'You may still need clearer drawings, a more realistic budget, a better understanding of approvals, the right professional team, and a clearer picture of the land.',
      'Project Readiness Score is being built to look at those areas together and show where more preparation may be needed. It is a planning review, not a certificate that the site is ready.',
    ],
    primaryCta: 'Join early access',
    problemHeadline: 'Starting work is not the same as being ready to build',
    problemIntro: [
      'Money becoming available is not the same as a project being prepared. Several things can still be unfinished when someone says it is time to mobilise.',
    ],
    without: [
      'Work starts because money became available.',
      'Drawings may still be incomplete.',
      'The budget may be a guess.',
      'Approvals may not be understood.',
      'Professional roles may not be clearly assigned.',
    ],
    with: [
      'Review the main readiness areas together.',
      'See which parts look stronger.',
      'See which parts need attention.',
      'Leave with a pre-construction list instead of a rush to site.',
    ],
    inputs: [
      { label: 'Land status', why: 'Owning or identifying land is only one part of being ready.' },
      { label: 'Drawings status', why: 'Incomplete drawings make the rest of the project harder to price and build.' },
      { label: 'Budget status', why: 'An early figure and a worked budget are not the same thing.' },
      { label: 'Approval status', why: 'What you have confirmed, and what you have not.' },
      { label: 'Professional team', why: 'Who is actually responsible, and who is still missing.' },
    ],
    outputs: [
      { label: 'A readiness review', detail: 'A planning view of the project, not a pass or fail certificate.' },
      { label: 'Status by area', detail: 'Land, drawings, budget, approvals, and team.' },
      { label: 'A missing-preparation list', detail: 'What still needs work before mobilisation.' },
      { label: 'Suggested next steps', detail: 'Including other BuildMyHouse tools that match the gap.' },
    ],
    trustLine: 'This does not certify that a site is ready to build.',
    trustDetail:
      'It does not confirm that a project is legally, structurally, or professionally ready for construction. A number is not shown here because this page does not invent a score the product has not defined.',
    steps: [
      { title: 'Answer questions about the project', detail: 'Land, drawings, money, approvals, and people.' },
      { title: 'Review the five areas', detail: 'See them side by side.' },
      { title: 'See where preparation is weak', detail: 'Those are the items to slow down for.' },
      { title: 'Work through the next steps', detail: 'Before anyone mobilises to site.' },
    ],
    journeyWhy: 'Readiness sits after the land and approval questions, and before a cost plan and a payment schedule.',
    journey: [
      { slug: 'land-purchase-risk-checker' },
      { slug: 'building-approval-navigator' },
      { slug: 'project-readiness-score' },
      { slug: 'nigeria-building-cost-planner' },
      { slug: 'milestone-payment-schedule' },
    ],
    homeowner:
      'Especially useful if you own land and are not sure what should happen before work begins. If someone back home says “we are ready to start”, you can first ask: ready in what sense?',
    professional:
      'Architects, quantity surveyors, and project consultants can use the same questions in an early client conversation. The review does not replace their professional judgement.',
    waitlistHeading: 'Before you mobilise to site, check whether the project is actually ready',
    waitlistCopy: 'Join the early-access list for Project Readiness Score.',
    preview: {
      kicker: 'Example — not a professional certificate',
      title: 'Project readiness',
      illustrative: true,
      note: EXAMPLE_NOTE,
      lines: [
        { label: 'Land', value: 'Ready for review' },
        { label: 'Drawings', value: 'Needs attention' },
        { label: 'Budget', value: 'Early estimate only' },
        { label: 'Approvals', value: 'Not confirmed' },
        { label: 'Team', value: 'Incomplete' },
        { label: 'Overall', value: 'More preparation recommended' },
      ],
    },
    faq: [
      {
        q: 'What should I have before starting construction in Nigeria?',
        a: 'The exact requirements depend on the project. Land, drawings, budget, approvals, and the professional team are the readiness areas this tool is being built around.',
      },
      {
        q: 'Does a strong readiness review guarantee the project will succeed?',
        a: 'No. It is planning guidance. It does not guarantee cost, programme, or a successful build.',
      },
      {
        q: 'Can I use it before choosing a contractor?',
        a: 'Yes. It is meant for early preparation, before you mobilise.',
      },
      {
        q: 'Can Nigerians abroad use it?',
        a: 'Yes.',
      },
      {
        q: 'Does it replace an architect or a quantity surveyor?',
        a: 'No.',
      },
    ],
  },
  'build-buy-or-renovate-calculator': {
    seoTitle: 'Build, Buy or Renovate in Nigeria? | BuildMyHouse',
    seoDescription:
      'Compare building, buying and renovating using your budget, timeline and intended use before choosing a property strategy.',
    eyebrow: 'Property decision tool',
    outcome: 'Compare three very different property decisions before committing your money to one.',
    supporting: [
      'Should you build from scratch, buy an existing property, or renovate what you already have? There is no answer that fits everyone.',
      'The better direction depends on your budget, your timeline, what the property is for, whether you already have land or a building, and how much construction work you are willing to manage.',
      'This calculator is being built to organise those trade-offs. It does not tell you which investment is guaranteed to be best.',
    ],
    primaryCta: 'Join early access',
    problemHeadline: 'Do not answer a large property question with one sentence',
    problemIntro: [
      '“Building is always cheaper.” “Just buy something completed.” “Renovate the old house.” Advice like that usually describes someone else’s situation.',
    ],
    without: [
      'A single sentence stands in for a large decision.',
      'The advice reflects another person’s land, budget, or timeline.',
      'Unknowns stay hidden until money is already committed.',
    ],
    with: [
      'Compare the routes against your own priorities.',
      'Look at budget and timeline together.',
      'Consider what the property is for.',
      'See which unknowns still need a professional.',
    ],
    inputs: [
      { label: 'Budget range', why: 'The comparison should start from what you can actually consider, not from a universal price.' },
      { label: 'Desired timeline', why: 'A faster move-in and a longer build are different decisions.' },
      { label: 'What the property is for', why: 'A family home, a rental, or another use can change the trade-off.' },
      { label: 'Whether you already have land or a building', why: 'Starting from nothing is not the same as starting from a house you already own.' },
      { label: 'How much construction complexity you can accept', why: 'Some people want less site work. Others want more control over the design.' },
    ],
    outputs: [
      { label: 'A side-by-side comparison', detail: 'Build, buy, and renovate, described against your answers.' },
      { label: 'Advantages and trade-offs', detail: 'What each route tends to make easier, and what it leaves open.' },
      { label: 'Important unknowns', detail: 'Facts you still do not have.' },
      { label: 'Questions for a professional', detail: 'What should be investigated before you commit.' },
      { label: 'A suggested next tool', detail: 'A different BuildMyHouse tool depending on the direction you want to explore.' },
    ],
    trustLine: 'This is a comparison, not an investment recommendation.',
    trustDetail: 'No route is presented as universally best. Location, condition, and timing can change the result.',
    steps: [
      { title: 'Say what you are trying to achieve', detail: 'Home, rental, or another use.' },
      { title: 'Add your budget and timeline', detail: 'Your constraints, not a generic example.' },
      { title: 'Compare build, buy, and renovate', detail: 'See the trade-offs next to each other.' },
      { title: 'Investigate the stronger-looking route', detail: 'Before you commit money to it.' },
    ],
    journeyWhy: 'The next tool depends on which route you want to examine. Buying, building, and renovating do not share one straight path.',
    journey: [
      { slug: 'build-buy-or-renovate-calculator' },
      {
        title: 'If you want to buy',
        href: '/tools/land-purchase-risk-checker',
        tagline: 'Then check land risk, and inspect an existing house before you commit.',
        live: false,
      },
      {
        title: 'If you want to build',
        href: '/tools/project-readiness-score',
        tagline: 'Review readiness, then plan the building cost.',
        live: false,
      },
      {
        title: 'If you want to renovate',
        href: '/tools/renovation-budget-planner',
        tagline: 'Start with a renovation budget direction. This planner is live.',
        live: true,
      },
    ],
    homeowner:
      'Useful when money is available but you are not yet sure whether to build, buy, or renovate, including family decisions about an older house.',
    professional:
      'Advisers can use it as an early framework before a deeper financial or technical analysis. It does not replace that analysis.',
    waitlistHeading: 'Build, buy, or renovate? Start with your situation, not somebody else’s opinion.',
    waitlistCopy: 'Join the early-access list.',
    preview: {
      kicker: 'Example decision brief',
      title: 'Three routes',
      illustrative: true,
      note: EXAMPLE_NOTE,
      lines: [
        { label: 'Build', value: 'More setup. More design control.' },
        { label: 'Buy', value: 'May be faster to occupy. Purchase checks still apply.' },
        { label: 'Renovate', value: 'Uses what you have. Condition must be assessed.' },
        { label: 'Best direction', value: 'Needs more information' },
      ],
    },
    faq: [
      {
        q: 'Is it cheaper to build or buy a house in Nigeria?',
        a: 'There is no answer that applies to every property. Location, whether you already own land, the specification, the market, and the timeline can all change the comparison.',
      },
      {
        q: 'Is renovating always cheaper than rebuilding?',
        a: 'No. The condition of the existing structure matters.',
      },
      {
        q: 'Will the calculator tell me which option is best?',
        a: 'It is meant to compare trade-offs. It does not make a guaranteed investment decision.',
      },
      {
        q: 'Can Nigerians abroad use it?',
        a: 'Yes.',
      },
      {
        q: 'Should I inspect an existing property before deciding to renovate it?',
        a: 'Yes, especially when the building’s condition is uncertain.',
      },
    ],
  },
  'plot-to-project-feasibility': {
    seoTitle: 'What Can I Build on My Plot in Nigeria? | BuildMyHouse',
    seoDescription:
      'Turn plot size, location, access, slope and intended building use into an early feasibility brief before paying for a full design.',
    eyebrow: 'Land-to-project tool',
    outcome: 'Understand the questions your plot needs to answer before you start designing the building.',
    supporting: [
      'Buying land is one decision. Knowing what is realistically suitable for that land is another.',
      'Plot size alone does not tell the whole story. Access, shape, slope, location, planning limits, and what you want to build all matter.',
      'This tool is being built to turn those early facts into a brief you can take into a professional conversation. It does not decide what you are legally allowed to build.',
    ],
    primaryCta: 'Join early access',
    problemHeadline: 'A plot measurement does not automatically tell you what should be built there',
    problemIntro: [
      'Design can run ahead of the site. Access, slope, and planning limits are easier to face before money is spent on a concept that has to be redrawn.',
    ],
    without: [
      'Design starts before access or site conditions are considered.',
      'The dream can move ahead of planning reality.',
      'Site limits appear late.',
      'Money is spent on concepts that need major revision.',
    ],
    with: [
      'Organise the basic site facts first.',
      'Include access and slope.',
      'State what you want to build.',
      'Take a clearer brief to an architect and other professionals.',
    ],
    inputs: [
      { label: 'Plot size', why: 'A starting fact, not the whole answer.' },
      { label: 'Location', why: 'Planning questions depend on where the land is.' },
      { label: 'Access', why: 'How you reach the plot can affect construction and design.' },
      { label: 'Slope or terrain', why: 'The ground can affect drainage, foundations, and how complex the build becomes.' },
      { label: 'Intended building and known limits', why: 'What you want, and any constraint you already know about. Maps and coordinates are not promised on this page.' },
    ],
    outputs: [
      { label: 'An early feasibility brief', detail: 'The site facts, written so a professional can start from them.' },
      { label: 'Questions to confirm', detail: 'Site issues that still need a professional.' },
      { label: 'Access and planning points', detail: 'Considerations, not an approval.' },
      { label: 'A better first conversation', detail: 'Information an architect can use at the start.' },
      { label: 'Suggested next steps', detail: 'Survey, planning, or design conversations, as the brief suggests.' },
    ],
    trustLine: 'The software does not decide what you can legally build.',
    trustDetail:
      'It does not replace an architect, planning approval, a structural engineer, a survey, or a soil investigation.',
    steps: [
      { title: 'Describe the plot', detail: 'Size, location, access, and terrain.' },
      { title: 'Say what you want to build', detail: 'The intended use, in plain language.' },
      { title: 'Review the main site questions', detail: 'What still needs a professional answer.' },
      { title: 'Take the brief into design and planning', detail: 'Before you pay for a full scheme that ignores the site.' },
    ],
    journeyWhy: 'Feasibility sits after the survey questions and before approval, readiness, and a building-cost plan.',
    journey: [
      { slug: 'land-purchase-risk-checker' },
      { slug: 'survey-plan-review-request' },
      { slug: 'plot-to-project-feasibility' },
      { slug: 'building-approval-navigator' },
      { slug: 'project-readiness-score' },
      { slug: 'nigeria-building-cost-planner' },
    ],
    homeowner:
      'Useful if you own a plot and have not started design, including land bought years ago that now needs a proper brief before you hire an architect.',
    professional:
      'Architects and planning consultants can use the brief as the first layer of client information. It does not replace their design.',
    waitlistHeading: 'Before designing the house, understand the plot',
    waitlistCopy: 'Join the early-access list for Plot-to-Project Feasibility Brief.',
    preview: {
      kicker: 'Example — not architectural approval',
      title: 'Feasibility brief',
      illustrative: true,
      note: EXAMPLE_NOTE,
      lines: [
        { label: 'Plot information', value: 'Captured' },
        { label: 'Access', value: 'Needs review' },
        { label: 'Slope', value: 'Moderate' },
        { label: 'Intended project', value: 'Residential' },
        { label: 'Next step', value: 'Architect or planning review' },
      ],
    },
    faq: [
      {
        q: 'Can this tool tell me exactly what I can legally build?',
        a: 'No. What you are allowed to build must be confirmed with the appropriate professionals and authorities.',
      },
      {
        q: 'Why does plot access matter?',
        a: 'Access can affect how materials and people reach the site, and it can affect design and planning.',
      },
      {
        q: 'Why does slope matter?',
        a: 'The terrain can affect site planning, drainage, the foundation approach, and how complex construction becomes.',
      },
      {
        q: 'Do I still need an architect?',
        a: 'Yes, for the architectural design and the professional services that go with it.',
      },
      {
        q: 'Can I use it before buying the land?',
        a: 'You can use the questions to think about a plot you are considering. It does not replace the checks you should make before you buy.',
      },
    ],
  },
  'abandoned-building-recovery-checker': {
    seoTitle: 'Unfinished Building Recovery Checker Nigeria | BuildMyHouse',
    seoDescription:
      'Describe an incomplete or abandoned building and get guidance on the inspections and next steps to consider before construction restarts.',
    eyebrow: 'Incomplete project tool',
    outcome: 'Before restarting an old project, find out what needs to be checked first.',
    supporting: [
      'Maybe the house stopped at lintel. Maybe the roof went on and nobody returned. Maybe construction stopped five years ago. Maybe you inherited the project and do not know what was done properly.',
      'The worst next step is simply to bring a contractor back and continue from where the last person stopped.',
      'This tool is being built to collect the current stage, the visible condition, and the project history, then suggest the kinds of inspection to consider before work restarts.',
    ],
    primaryCta: 'Join the early-access list',
    problemHeadline: 'An unfinished building cannot simply continue from the date work stopped',
    problemIntro: [
      'Time, weather, missing drawings, and a new contractor who did not do the earlier work all change what “continue” should mean.',
    ],
    without: [
      'Nobody may remember the original scope.',
      'Materials may have deteriorated.',
      'Water exposure can create new problems.',
      'Old drawings may no longer match what exists.',
      'A new contractor may assume work they did not perform.',
    ],
    with: [
      'Record the present condition.',
      'Identify the current stage.',
      'Organise the photos and history you actually have.',
      'See which professional inspections may be needed before restarting.',
    ],
    inputs: [
      { label: 'Current stage', why: 'Where the work actually stopped, as far as you know.' },
      { label: 'How long it has been inactive', why: 'A longer pause usually means more to check.' },
      { label: 'Known history', why: 'What you were told, and what you can document.' },
      { label: 'Visible issues', why: 'What can be seen now. This is not a structural test.' },
      { label: 'Photos or old drawings', why: 'Only if the finished tool supports those uploads. This page does not ask you to send them yet.' },
    ],
    outputs: [
      { label: 'A recovery assessment', detail: 'An organised picture of what is known. Not a safety certificate.' },
      { label: 'Suggested inspection categories', detail: 'Such as structure, roof, electrical, or plumbing, depending on the answers.' },
      { label: 'Missing information', detail: 'What you still cannot say about the building.' },
      { label: 'Professionals who may need to inspect', detail: 'Roles to consider. Not a claim that one visit is enough.' },
      { label: 'Next steps before restarting', detail: 'What should happen before a contractor continues the work.' },
    ],
    trustLine: 'This is not structural certification.',
    trustDetail:
      'Questionnaire answers and photographs cannot tell you that a building is safe. Do not restart work on that basis.',
    steps: [
      { title: 'Say where the project stopped', detail: 'The stage you can actually describe.' },
      { title: 'Describe what has happened since', detail: 'Time, weather, and any work done afterwards.' },
      { title: 'Record visible concerns', detail: 'And the documents you still have.' },
      { title: 'Review the inspections to arrange', detail: 'Before anyone is asked to continue.' },
    ],
    journeyWhy: 'Recovery leads into readiness, a budget for the remaining work, and a payment schedule. It does not jump straight back to site.',
    journey: [
      { slug: 'abandoned-building-recovery-checker' },
      { slug: 'project-readiness-score' },
      { slug: 'renovation-budget-planner' },
      { slug: 'nigeria-building-cost-planner' },
      { slug: 'milestone-payment-schedule' },
      {
        title: 'Start a tracked project',
        href: '/start',
        tagline: 'When the inspections and the plan are clear enough to manage the work.',
        live: true,
      },
    ],
    homeowner:
      'For owners of incomplete buildings, families who inherited an unfinished house, Nigerians returning to a project that stopped years ago, and anyone considering the purchase of an unfinished property.',
    professional:
      'Architects, engineers, and quantity surveyors may use the first set of answers as a starting point before a formal assessment. The tool does not perform that assessment.',
    waitlistHeading: 'The building has waited long enough. Do not restart blindly.',
    waitlistCopy: 'Join the early-access list for the Abandoned Building Recovery Checker.',
    preview: {
      kicker: 'Example — not structural certification',
      title: 'Before you restart',
      illustrative: true,
      note: EXAMPLE_NOTE,
      lines: [
        { label: 'Current stage', value: 'Roofed shell' },
        { label: 'Time inactive', value: 'Several years' },
        { label: 'Visible condition', value: 'Issues recorded' },
        { label: 'Structural and roof review', value: 'Recommended' },
        { label: 'Next step', value: 'Professional inspection before restart' },
      ],
    },
    education: [
      {
        heading: 'Before you continue an unfinished building in Nigeria',
        paragraphs: [
          'Do not assume that yesterday’s structure is ready for today’s work.',
          'First establish what was actually built, how long it has been exposed, whether the old drawings still match, and what condition the structure is in.',
          'Also ask whether plumbing or electrical work already exists, whether approvals or professional information need updating, and what a realistic recovery budget may require. This page does not calculate that cost.',
          'When you are ready to go further, use the pre-purchase inspection for a structured look at condition, Project Readiness Score before mobilisation, the Renovation Budget Planner or Nigeria Building Cost Planner for money, and the Milestone Payment Schedule Builder so payment follows the remaining work.',
        ],
      },
    ],
    extraLinks: [
      { label: 'Pre-purchase property inspection', href: '/tools/pre-purchase-property-inspection' },
      { label: 'Project Readiness Score', href: '/tools/project-readiness-score' },
      { label: 'Renovation Budget Planner', href: '/tools/renovation-budget-planner' },
      { label: 'Nigeria Building Cost Planner', href: '/tools/nigeria-building-cost-planner' },
      { label: 'Milestone Payment Schedule Builder', href: '/tools/milestone-payment-schedule' },
    ],
    faq: [
      {
        q: 'Can I continue building from where construction stopped?',
        a: 'Possibly, but the existing work should be assessed first. The longer a project has been inactive, the more important that inspection becomes.',
      },
      {
        q: 'Can BuildMyHouse tell whether the structure is safe from photos?',
        a: 'No.',
      },
      {
        q: 'Which professional may need to inspect an unfinished building?',
        a: 'It depends on the project and the condition. An architect, a structural engineer, a quantity surveyor, or another specialist may be relevant.',
      },
      {
        q: 'Can I use this if I inherited an unfinished house?',
        a: 'Yes. It is meant to organise what is known and what still needs investigation.',
      },
      {
        q: 'Will the tool estimate what completion will cost?',
        a: 'No. Use the Renovation Budget Planner or the Nigeria Building Cost Planner when you are ready to think about money. This checker does not produce a completion price.',
      },
    ],
  },
};

export const BATCH_2_SLUGS = Object.keys(pages);

export function getBatch2Page(slug: string): ToolPageCopy | undefined {
  return pages[slug];
}

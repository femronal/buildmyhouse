import type { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import { REDEVELOPMENT_ARTICLE_PATH } from '@/lib/redevelopment-readiness-check';
import { buildSeoJsonLd } from '@/lib/seo-schema';

const CANONICAL = `https://buildmyhouse.app${REDEVELOPMENT_ARTICLE_PATH}`;

export const redevelopmentReadinessContent = {
  seo: {
    title: 'How to Develop Your Land or Unfinished Building With a Developer in Nigeria | BuildMyHouse',
    description:
      'Have land or an unfinished building but not enough money to complete it? Understand developer partnerships, Joint Ventures, Build–Operate–Transfer, financing and how to protect your property before signing a deal.',
    canonical: CANONICAL,
    robots: 'index, follow',
  },
  hero: {
    eyebrow: 'Development partnership guide',
    title: 'Your Building Stopped Because the Money Stopped. That Does Not Mean You Should Give It Away.',
    description:
      'A practical guide for Nigerian property owners considering a developer, investor or development partner for their land or unfinished building.',
  },
  excerpt:
    'Land or an unfinished building is not automatically a development deal. This guide explains financing, phased completion, sharing a project with a developer, and how to check the property before you sign anything away.',
  coverImage: {
    src: 'https://buildmyhouse.app/engineer-at-buildmyhouse.png',
    alt: 'Illustration of an unfinished building being reviewed before a development decision',
  },
  publishedAt: '2026-10-09',
  updatedAt: '2026-10-09',
  readingMinutes: 18,
  tags: [
    'developer for unfinished building Nigeria',
    'joint venture',
    'Lagos',
    'unfinished building',
    'development partnership',
  ],
  keyTakeaways: [
    'Running out of money is not the same problem as needing a developer. Financing, phasing or selling a portion may cost less than giving away part of the property.',
    'A developer looks at what the land can legally become and what remains after cost, not at how much you have already spent.',
    'There is no standard split. A percentage only makes sense after land value, build cost, fees, tax and risk are written down.',
    'BuildMyHouse does not promise a developer, an investor or a return. The first step is a documented property, not a WhatsApp introduction.',
  ],
  htmlBeforeTool: `
<p>You have the land. Maybe you started building years ago. Foundation done. Blocks up. Perhaps roofing. Maybe you even finished one floor. Then the money stopped.</p>
<p>Every year, the building sits there. Cement gets more expensive. Rain enters places it should not. People keep asking when you will finish it. Then somebody gives you an idea: <strong>why not find a developer, let them finish the property, and share what comes out of it?</strong></p>
<p>That can be a very good idea. It can also become a very expensive mistake. The problem is not simply finding somebody who says, “I am a developer.” The real question is what you are giving them, what they are bringing, what will be built, how everybody gets paid, and what still belongs to you at the end.</p>
<p>Before BuildMyHouse helps an owner look for a development partner, those questions need answers. They apply whether you want a developer for an unfinished building in Nigeria, a landowner–developer partnership, a joint venture on a Lagos property, or a developer to build on land you already own.</p>
<h2>First: your abandoned building may not actually need a developer</h2>
<p>When construction stops because money runs out, many owners immediately think there are only two choices: sell the property, or find a developer. There are more options than that.</p>
<p>Imagine your house needs another ₦25 million to become habitable, but handing it to a developer would require you to give away apartments or a large share of its future value. If you qualify for sensible financing and can repay it, borrowing may cost you much less in the long run.</p>
<p>The Federal Mortgage Bank of Nigeria says eligible National Housing Fund contributors can access mortgage financing of up to ₦50 million to build, buy, improve or renovate their own home, subject to its conditions. That figure is FMBN’s published product limit, not a loan BuildMyHouse arranges, and it is not available to everybody. The useful point is narrower: do not surrender part of your property until you have asked whether this is a development-partner problem or simply a financing problem. Sometimes the cheapest partner is no partner at all.</p>
<p><a href="https://fmbn.gov.ng/products/nhf_mortgage_loan" rel="nofollow noopener">FMBN: NHF mortgage loan</a></p>
<h2>Is this still a house, or has it become a development opportunity?</h2>
<p>Suppose you own an unfinished four-bedroom bungalow on one plot. There may be very little additional value a developer can create beyond finishing your home.</p>
<p>Now imagine you own 1,500 square metres in a strong Lagos location with an old bungalow sitting on it, but planning rules and market demand could support several apartments. That is different. The developer is no longer looking at your old bungalow. The developer is looking at what that land could become.</p>
<p>You may be calculating, “I have already spent ₦70 million on this house.” The developer may be calculating, “If I put another ₦300 million into this land, what can I legally build, what could it sell or rent for, and what remains after all costs?” Both questions matter. The second question is what determines whether somebody will actually bring capital into the project. Your previous spending does not automatically make the opportunity attractive. The naira figures here are examples, not a valuation of your property.</p>
<h2>Before searching for a developer, find out what you actually have</h2>
<p>The wrong sequence is: abandoned building, then find a developer, then negotiate percentages. A safer sequence is: verify the property, inspect what exists, understand what can be developed, estimate the money required, understand the likely finished value, and only then decide what kind of partner makes sense.</p>
<p>You would not invite somebody to buy half of a business before knowing what the business owns, owes and can earn. Your property should not be treated differently.</p>
<p>A serious readiness exercise should establish who owns the property, whether the title is suitable for the proposed transaction, whether there are existing mortgages or other claims, what approvals exist, what condition the existing structure is in, what can reasonably be developed, approximately what that development could cost, and what the completed property could realistically generate. That turns “I have an abandoned building” into “here is a documented opportunity somebody can evaluate.”</p>
<h2>What “joint venture” actually means</h2>
<p>You may hear a developer say, “Let’s do a JV.” JV simply means joint venture. You have something valuable. The developer has something valuable. You agree to combine them for one project.</p>
<p>You might bring the land. The developer might bring the money, the development team and the ability to build. Instead of the developer buying your land today, you both share what comes out of the development according to an agreement.</p>
<p>Imagine the land can accommodate six apartments. One possible agreement could say the landowner receives two apartments and the developer receives four. Another arrangement could divide sales proceeds rather than physical apartments. Another could combine an upfront payment with a smaller percentage of future proceeds. There is no magic “normal” percentage.</p>
<p>The split should make economic sense based on land value, development cost, finance cost, expected selling value, professional fees, approvals, taxes, marketing, contingency and the risk each party is taking. Agreeing to “40/60” because somebody said that is what developers normally offer can be dangerous. A percentage without the numbers behind it is only a percentage.</p>
<p>Nigerian development guidance describes the basic landowner–developer model the same way: the owner contributes land instead of cash, the developer contributes construction capital and delivery, and the eventual value is divided under the agreement.</p>
<p><a href="https://www.eazybuild.ng/resources/how-landowner-developer-jvs-work-in-nigeria" rel="nofollow noopener">EazyBuild: how landowner–developer joint ventures work in Nigeria</a></p>
<h2>Build, operate, then transfer</h2>
<p>You may also hear BOT. It means Build–Operate–Transfer. You have a property. A developer spends their money developing it. Instead of immediately dividing apartments, the developer may be allowed to operate or earn income from the development for an agreed period. That income helps the developer recover the money they spent and earn an agreed return. At the end of the agreed period, control or rights return according to the contract.</p>
<p>You provide the opportunity. They build it. They use it for an agreed period. Eventually you get back what the agreement says returns to you.</p>
<p>This structure can work particularly well where the property can generate substantial recurring income: apartments, student accommodation, serviced accommodation, or another income-producing development. An ordinary family bungalow often will not. Recent Nigerian property commentary describes the same sequence: the developer finances and builds, operates for an agreed period to recover investment and profit, and transfers the completed asset according to the arrangement.</p>
<p><a href="https://guardian.ng/opinion/letters/property-development-why-joint-venture-often-beats-selling/" rel="nofollow noopener">The Guardian Nigeria: property development commentary</a></p>
<p>Build–Operate–Transfer is not automatically better than sharing the finished development. The important question is where the money used to repay the developer will actually come from. If the property cannot generate enough income, a beautiful proposal on paper may make little commercial sense.</p>
`,
  htmlAfterTool: `
<h2>You do not always need the developer to bring all the money</h2>
<p>Many owners assume the only shape of a deal is: the owner has the property, and the developer must have the money. Serious projects can involve three different parties. You own the property. An investor or lender provides some or all of the capital. A developer builds the project. BuildMyHouse can coordinate that arrangement so the owner, the capital and the builder stay distinct, with one record of scope, decisions and progress.</p>
<p>That matters because the best builder may not be the person with the deepest pocket, and the person with capital may have no interest in running a building site.</p>
<h2>Sometimes a separate company is created just for the development</h2>
<p>For larger developments, a lawyer may recommend a special purpose vehicle, often shortened to SPV. Forget the initials for a moment. Imagine putting the entire project inside its own box. That box has one job: develop this property. The landowner, developer and perhaps investors can have clearly defined interests in that project company. Project money can be separated from unrelated business activity. Decision-making rules, extra costs, who receives what, and what happens if somebody wants to leave can all be written down.</p>
<p>A March 2026 analysis by G. Elias explains that larger residential developments in Nigeria are often structured using a project-specific company, and that the parties should settle early what each side contributes, how profits or units are shared, who pays extra costs, who controls important decisions, and how a deadlock is resolved. Those questions are exactly where many seemingly good partnerships later break.</p>
<p><a href="https://www.gelias.com/images/Structuring_High_Rise_Residential_Development_Project_Article.pdf" rel="nofollow noopener">G. Elias: structuring high-rise residential development in Nigeria</a></p>
<h2>“The developer said they will fund everything” is not enough</h2>
<p>Suppose somebody tells you not to worry about money because they will finance everything. Ask the next question: with whose money?</p>
<p>There is nothing wrong with a developer using financing. Development businesses normally use different sources of capital. You should still understand the plan. Are they funding construction from their own balance sheet? Have they obtained bank financing? Are private investors funding it? Are they depending on selling apartments before construction is completed? Does the project only continue if enough buyers pay deposits?</p>
<p>Imagine the developer needs ₦500 million to complete the project but only has ₦50 million available. Their entire plan may depend on advertising apartments and collecting money from buyers before the building is finished. That model can work. It also means your construction risk is partly tied to how successfully they sell. If sales slow down, construction may slow down. If construction slows down, buyers become nervous, and sales slow further. A developer’s promise should never replace evidence of their financial plan. Again, these figures are an illustration, not a quote for your site.</p>
<h2>Serious capital asks serious questions</h2>
<p>The MOFI Real Estate Investment Fund, MREIF, is useful here not because every homeowner can submit an abandoned bungalow for funding. Its published standards show how professional capital thinks. MREIF says developers seeking participation must demonstrate a sufficient land bank and net asset value, an ability to raise part of the required project financing, and a verifiable record of completed housing projects. Its published criteria include at least five hectares of titled land, net assets of at least ₦500 million, the ability to raise at least 30 percent of project cost, and at least three completed housing projects within five years.</p>
<p><a href="https://www.mreif.com.ng/" rel="nofollow noopener">MREIF</a> · <a href="https://www.mreif.com.ng/developers" rel="nofollow noopener">MREIF developer criteria</a></p>
<p>Nobody there is saying, “He called himself a developer, so give him the land.” They are asking what he has done before, whether he has financial capacity, whether he can raise his contribution, and whether the history can be verified. Your project may be much smaller than anything MREIF would consider. The principle still applies. Do not only verify your land for the developer. Verify the developer for your land.</p>
<h2>The developer is also being interviewed</h2>
<p>When homeowners approach developers, they often behave as though they are applying for help. The developer is also asking you to entrust them with an asset that could represent decades of your family’s work. You are interviewing each other.</p>
<p>A credible developer should be able to show what they have completed, not merely what they are currently advertising. Look at projects that resemble yours. Speak with previous landowners where possible. Find out whether old projects finished. Check whether the company taking responsibility is the same company whose previous projects you examined. Understand their proposed financing, the people responsible for design and construction, and what happens when costs increase, when the project stops, or when either party breaks the agreement.</p>
<p>A beautiful Instagram page is not a balance sheet. A branded helmet is not evidence of capital. “Development Limited” after a company’s name does not mean your property is safe with them.</p>
<h2>You should also know what the developer is checking about you</h2>
<p>A serious developer is unlikely to commit hundreds of millions of naira simply because you showed them a plot. They will want to establish that your ownership is genuine, that the people signing have authority, that a family dispute will not appear after construction begins, that the property is not carrying undisclosed obligations, that the proposed development is legally and physically feasible, and that the numbers work.</p>
<p>The same G. Elias analysis places title confirmation and due diligence at the foundation of a successful project: title, encumbrances, permitted use, government acquisition, boundaries and regulatory readiness. Good developers do not just check whether there is land. They check whether there is a deal.</p>
<p>If BuildMyHouse asks for documents, survey information, photographs, approvals and permission to inspect the site before approaching anyone, that is the same standard. We are trying to find out whether you have something another serious party can actually consider.</p>
<h2>Sometimes the smartest solution is to finish only part of the property</h2>
<p>Imagine you started a six-flat building. Money ran out. You need ₦100 million to finish everything, but ₦20 million could finish two apartments. Those two apartments could then be rented. The income may not finance the whole development, but you would have a functioning asset rather than six unfinished units. Phased completion will not work for every building. Before surrendering a large share of a valuable property, ask whether the project can be broken into smaller economically useful stages. Do not give away half of the farm merely because you cannot harvest the whole farm this season.</p>
<h2>Sometimes selling a small piece is better than sharing the whole property</h2>
<p>Imagine you own four plots and you only need two for the project you really want. Selling one plot, or restructuring the site and disposing of a portion, could provide capital to develop what you retain. You may end up owning less land but keeping full control of the development you actually care about. Finding a developer should be one option on the table, not the entire table.</p>
<h2>And sometimes the numbers simply do not work</h2>
<p>Your property may be valuable. Your dream may be reasonable. The development may still not make commercial sense for an outside investor. Suppose the finished development could reasonably be worth ₦500 million, but after construction, finance, professional fees, approvals, taxes, sales costs, contingency and the value you expect for contributing the land, there is almost nothing left for the person taking the development risk. You may search for years and never find the “right developer.” The problem may not be the developers. The deal may simply not work.</p>
<p>BuildMyHouse would rather tell an owner that a structure does not appear attractive yet than spend months sending the property to developers who will politely disappear. Sometimes the solution is a cheaper design. Sometimes it is a different use. Sometimes it is phasing. Sometimes it is financing. Sometimes it is selling. And sometimes it is waiting.</p>
<h2>Be careful when somebody says they will bring investors from abroad</h2>
<p>One private investor negotiating a properly documented arrangement with a property owner is one thing. Advertising “invest ₦5 million into this Lagos project and earn 30 percent” to strangers is something very different.</p>
<p>Nigeria’s Securities and Exchange Commission regulates investment activity in the capital market. In May 2026, the SEC warned about unregistered online investment schemes and stated that, under the Investments and Securities Act 2025, entities promoting investment services, providing investment advice or soliciting public funds in Nigeria’s capital market must be appropriately registered. Nigeria also has specific rules for investment-based crowdfunding: the SEC says that activity must operate through registered intermediaries and portals.</p>
<p><a href="https://home.sec.gov.ng/for-investors/keep-track-of-circulars/public-notice-unregistered-online-investment-schemes/" rel="nofollow noopener">SEC public notice on unregistered online investment schemes</a> · <a href="https://www.sec.gov.ng/our-mandate/regulation/rules-and-regulations/sec-rules-for-fintechs/" rel="nofollow noopener">SEC rules for fintechs</a></p>
<p>People who search for “unfinished building investment in Nigeria” are often looking for someone else to fund completion. That is a partnership question. It is not a public offer to put money into a property for a promised percentage. BuildMyHouse does not invite the public to send money into your property, and this page does not promise a return. We document what you own, review what can be verified, and, where appropriate, introduce the property to a developer, lender or investor. Qualified lawyers and advisers structure any transaction. If a property later appears in BuildMyHouse Opportunities, that is a separate process. It is not an invitation, on this page, to invest.</p>
<h2>Bigger investors will not arrive merely because your land is valuable</h2>
<p>Large capital can participate in Nigerian housing. It usually needs large, organised opportunities. MREIF’s published developer criteria ask for scale, financial capacity and completed projects. The fund also describes offtake support, which means reducing the risk that completed homes will have nobody ready to buy them, so qualified developers can obtain financing. MOFI has described MREIF as using public and private capital to expand housing finance at scale, with funding raised in substantial phases rather than one house at a time.</p>
<p><a href="https://mofi.com.ng/mofi-launches-n150-billion-real-estate-investment-fund-to-address-nigerias-housing-deficit/" rel="nofollow noopener">MOFI on the real estate investment fund</a></p>
<p>If you own one unfinished house, waiting for a multinational investor is usually the wrong first strategy. What you can do now is make this property understandable: who owns it, what stands on the site, what may be developed, what it may cost, what you want, and which questions are still open. That is a conversation a serious partner can read. It is not a promise that a fund will fund it.</p>
<h2>The agreement must answer the ugly questions before anything becomes ugly</h2>
<p>When everybody is excited at the beginning, people like discussing how many apartments there will be, what the building will look like, and who gets the penthouse. The agreement also needs the uncomfortable questions. What happens if construction costs increase by ₦100 million? Who provides the extra money? What happens if the developer stops work for six months? What happens if the owner refuses an approval the developer needs? Can the developer borrow against the project, or bring another investor? Can either party sell its interest? What happens if units do not sell? Who chooses contractors, approves major variations, and controls project accounts? Who owns the designs? What happens if one party dies, if there is a dispute, or if the relationship completely breaks down?</p>
<p>The G. Elias analysis is clear that sophisticated development structures document contributions, cost overruns, control rights, allocation of units or profits, exit rights and deadlock procedures. A good agreement is written so that a disagreement does not destroy the project.</p>
<h2>Start with the property, not with “who can fund my house?”</h2>
<p>The useful first question is: what exactly do I own, what can it become, and what deal would actually make sense?</p>
<p>The Redevelopment Readiness Check on this page is how that starts. You say whether you want to keep the property, share completed units, receive money, get the property back after a developer operates it, separate the person with capital from the company that builds, or finish one stage yourself. Those answers change the kind of partner worth pursuing. The property itself still has to be investigated. Only after that should anyone package an opportunity for a developer, investor or financing partner. Completing the check does not mean a developer or investor will accept the property.</p>
<h2>Five roads an owner may eventually take</h2>
<p>You do not need to memorise property-finance terminology.</p>
<p><strong>Road one: find financing and keep the property yourself.</strong> If the amount needed is manageable and you can repay suitable financing, giving away future property value may be unnecessary.</p>
<p><strong>Road two: finish the property in smaller stages.</strong> Complete the part that makes the asset usable or income-producing before tackling everything else.</p>
<p><strong>Road three: share the development with a developer.</strong> This is the joint venture: your property is your contribution, the developer brings capital and execution, and you divide the result under a written agreement.</p>
<p><strong>Road four: allow a developer to build and operate it for a period.</strong> This is Build–Operate–Transfer. The developer invests, operates under agreed rights for an agreed period, and control or rights return according to the contract.</p>
<p><strong>Road five: separate the investor from the developer.</strong> One party brings capital. Another builds. You contribute the property. A properly structured project arrangement connects everyone.</p>
<p>None is automatically best. The correct road depends on your property and your numbers.</p>
<h2>What BuildMyHouse does not promise</h2>
<p>We will not tell you that we will definitely find an investor. We will not tell you that a developer cannot fail. We will not tell you that your property will make investors a particular percentage. We do not list a property as an attractive development opportunity simply because the owner asks us to.</p>
<p>Sometimes the most useful answer is that the project is not ready to approach developers yet. Finding that out before you sign away development rights is much cheaper than finding it out afterwards.</p>
<h2>What BuildMyHouse can do</h2>
<p>Our role is not to become the developer taking your land, and it is not to become the investor taking public money. We also do not replace your property lawyer, surveyor, quantity surveyor, architect or other specialists.</p>
<p>BuildMyHouse can be the coordination layer around the opportunity. We can help establish what information is missing, coordinate property and title verification, arrange inspection of what has already been built, bring the right technical professionals into the assessment, organise the documentation, and help examine whether completion, redevelopment or phasing deserves further study. If a deal later proceeds, we can help screen potential developers and coordinate the project.</p>
<p>The result should be more useful than “I have land in Lagos and I am looking for an investor.” It should be: here is the property, here is the ownership position, here is what stands on the site, here is what may be developed, here is what the owner wants, here are the known risks, and here are the questions a serious partner still needs answered.</p>
<h2>If your building has been sitting there for years, start here</h2>
<p>Do not begin by asking ten developers to visit. Do not begin by posting your title documents into random WhatsApp groups. Do not agree to a 60/40 split because somebody told you it is standard. Do not give development rights to somebody simply because they promise to bring investors. And do not assume that because someone has money, they should control your property.</p>
<p>First understand the asset. Then understand the numbers. Then decide what kind of capital it needs. Then verify the people offering that capital. Then put the agreement on paper properly.</p>
<p>Your house stopped because the money stopped. The next mistake would be allowing urgency to make you give away more than the missing money was ever worth.</p>
`,
  htmlFaq: `
<h2>Questions owners ask before bringing in a developer</h2>
<h3>Does an unfinished building automatically need a developer?</h3>
<p>No. If the remaining work is a financing problem, and you can repay suitable financing, keeping the property may cost less than giving away part of it. Phasing the work, or selling a portion to fund the rest, are also real options.</p>
<h3>Is there a standard joint-venture percentage in Nigeria?</h3>
<p>No. A split only makes sense after land value, construction cost, finance, fees, tax, selling costs and risk are written down. “40/60” without those numbers is only a percentage.</p>
<h3>Will BuildMyHouse find an investor if I complete the check?</h3>
<p>No. The check tells us what you own and what you want. It does not guarantee a developer, a lender or an investor, and it is not a way for the public to invest in your property.</p>
<h3>Who still has to advise me?</h3>
<p>Your property lawyer, and where needed a surveyor, valuer, architect, engineer or quantity surveyor. BuildMyHouse coordinates the process. We do not replace those professionals.</p>
`,
  faq: {
    title: 'Questions owners ask before bringing in a developer',
    items: [
      {
        question: 'Does an unfinished building automatically need a developer?',
        answer:
          'No. If the remaining work is a financing problem, and you can repay suitable financing, keeping the property may cost less than giving away part of it. Phasing the work, or selling a portion to fund the rest, are also real options.',
      },
      {
        question: 'Is there a standard joint-venture percentage in Nigeria?',
        answer:
          'No. A split only makes sense after land value, construction cost, finance, fees, tax, selling costs and risk are written down. A percentage without those numbers is only a percentage.',
      },
      {
        question: 'Will BuildMyHouse find an investor if I complete the check?',
        answer:
          'No. The check tells us what you own and what you want. It does not guarantee a developer, a lender or an investor, and it is not a way for the public to invest in your property.',
      },
      {
        question: 'Who still has to advise me?',
        answer:
          'Your property lawyer, and where needed a surveyor, valuer, architect, engineer or quantity surveyor. BuildMyHouse coordinates the process and does not replace those professionals.',
      },
    ],
  },
  internalLinks: {
    title: 'Related BuildMyHouse guides',
    links: [
      { label: 'How to verify land in Nigeria', href: '/land-verification-in-nigeria-guide' },
      { label: 'Buying property in Lagos from abroad', href: '/articles/buying-property-lagos-from-abroad-due-diligence' },
      { label: 'Finish an abandoned house from abroad', href: '/guides/how-to-finish-an-abandoned-house-in-nigeria-from-abroad' },
      { label: 'House construction in Nigeria', href: '/construction/nigeria' },
      { label: 'All articles', href: '/articles' },
    ] as InternalLinkItem[],
  },
} as const;

export function getRedevelopmentReadinessSchema() {
  const content = redevelopmentReadinessContent;
  const graph = buildSeoJsonLd({
    path: REDEVELOPMENT_ARTICLE_PATH,
    title: content.hero.title,
    description: content.seo.description,
    schemaType: 'Article',
    image: content.coverImage.src,
    faqs: content.faq.items.map((item) => ({ question: item.question, answer: item.answer })),
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Articles', path: '/articles' },
      { name: 'Developer partnership for an unfinished building', path: REDEVELOPMENT_ARTICLE_PATH },
    ],
  }).map((node) => {
    if (node['@type'] === 'Article') {
      return {
        ...node,
        headline: content.hero.title,
        alternativeHeadline: content.seo.title,
        datePublished: content.publishedAt,
        dateModified: content.updatedAt,
        author: { '@id': 'https://buildmyhouse.app/#organization' },
      };
    }
    return node;
  });

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

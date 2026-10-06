import type { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { PROPERTY_PURCHASE_ARTICLE_PATH } from '@/lib/property-purchase-safety-check';

const CANONICAL = `https://buildmyhouse.app${PROPERTY_PURCHASE_ARTICLE_PATH}`;

export const propertyPurchaseLagosDueDiligenceContent = {
  seo: {
    title: 'Buying Property in Lagos From Abroad: Due Diligence Guide | BuildMyHouse',
    description:
      'Buying a house or unfinished building in Lagos from abroad? Learn how to verify ownership, approvals, structural condition, drainage and hidden risks before you commit.',
    canonical: CANONICAL,
    robots: 'index, follow',
  },
  hero: {
    eyebrow: 'Property purchase guide',
    title: "The Building Is There. That Doesn't Mean You Should Buy It.",
    description:
      'You have seen the videos. The house exists. The documents arrived on WhatsApp. The neighbourhood looks fine. Someone says another buyer is interested. You are still abroad, and you are still uneasy. That unease is the right starting point.',
  },
  excerpt:
    'Buying property in Lagos from abroad requires more than checking the title. This guide explains how to investigate ownership, approvals, building condition, flooding, hidden repair costs and transaction readiness before committing your money.',
  coverImage: {
    src: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
    alt: 'A finished residential house seen from the front, the kind of property a buyer abroad may be shown on video',
  },
  publishedAt: '2026-10-06',
  updatedAt: '2026-10-06',
  readingMinutes: 16,
  tags: ['Lagos', 'property verification', 'due diligence', 'from abroad', 'house inspection'],
  keyTakeaways: [
    'A building that exists, and documents that look official, are not the same thing as a property that is ready to buy.',
    'Check three things separately: who can sell it, what Lagos approved, and what is physically standing there.',
    'A viewing, a WhatsApp video, a title search, a survey check and a technical inspection do different jobs. One does not replace the others.',
    'Drainage and the cost of an unfinished building can change the price even when the title looks clean.',
    'BuildMyHouse coordinates the checks and the record of findings. Your lawyer still guides the purchase. Specialist work is paid work.',
  ],
  htmlBeforeTool: `
<p>You are in London, Houston, Toronto, Dubai, or somewhere else outside Nigeria. A cousin, an agent, or the owner has sent a video of a house in Lagos. The gate opens. The paint looks fresh. The street is paved. A PDF follows: a title document, maybe a survey, maybe a floor plan. Then the message you were expecting arrives. Another buyer is interested. Can you send something so they know you are serious?</p>
<p>You like the property. You also know you cannot stand in the compound this weekend and ask the questions yourself.</p>
<p>That is the moment many buyers abroad collapse several different checks into one feeling. The video felt real, so the house must be real. The document has a stamp, so the title must be fine. A relative drove past, so the area must be safe. None of those observations is useless. None of them is enough.</p>
<p><strong>The property being real does not automatically mean the property is safe to buy.</strong></p>
<p>A house can stand on land the seller cannot transfer. A title can describe a different parcel from the one in the video. A planning approval can be for a bungalow while a second floor is already occupied. A roof can look new and still discharge water into a room you have not been shown. An unfinished frame can represent years of spending and still be the wrong thing to complete.</p>
<p>This guide is for that conversation. It is not a promise that any particular house is a good buy, and it is not legal advice for your transaction. Property circumstances differ. A property lawyer, a registered surveyor, and the relevant technical professionals should advise on the specific property before you commit money.</p>
<h2>Three different checks, often treated as one</h2>
<p>Remote buyers are usually shown a bundle: photos, a price, and a story. The story mixes ownership, government permission, and the condition of the building into a single sentence. “Everything is complete. C of O is ready. You can move in.”</p>
<p>Those are separate questions.</p>
<ul>
<li><strong>A viewing</strong> is someone walking you, or a camera, through the property.</li>
<li><strong>A document review</strong> is someone reading what the seller chose to send.</li>
<li><strong>Legal and title due diligence</strong> is an independent look at who owns the interest and whether the seller can transfer it.</li>
<li><strong>Survey verification</strong> asks whether the land in the survey is the land being sold.</li>
<li><strong>A building-approval review</strong> asks what Lagos allowed to be built, and whether the building in front of you still corresponds to that record.</li>
<li><strong>A technical inspection</strong> looks at the physical condition: structure, roof, water, power, drainage, and what it would cost to put right.</li>
<li><strong>A valuation</strong> is an opinion of market value. It is not a title search and it is not a structural inspection.</li>
</ul>
<p>If one person, usually the person who benefits if you pay, is the only source for all of those answers, you do not yet have an independent picture. You have a sales pack.</p>
<h2>The three truths of a property purchase</h2>
<p>BuildMyHouse uses a simple test for this kind of decision. Call it the three truths. They have to be investigated separately, and they have to be read together.</p>
<figure class="article-anim"><img src="/articles/property-purchase/three-truths.gif" alt="The three truths of a property purchase: paper truth for the title, survey and owner identity; government truth for the approved plan and official check; site truth for the actual building. The question is whether all three agree." width="800" height="1000" /></figure>
<h3>1. Paper truth</h3>
<p>Paper truth is about the right to sell.</p>
<ul>
<li>Who is recorded as holding the property interest?</li>
<li>Does the person asking you to pay have authority to transfer it?</li>
<li>What does the history of the title show, not only the newest page?</li>
<li>Does the survey describe the same land you are being shown?</li>
<li>Are there material encumbrances, disputes, litigation, government acquisition issues, or other title concerns that still need investigation?</li>
</ul>
<p>A document the seller sends is a claim. It can be genuine and still be incomplete. It can carry a government heading and still not be the record the registry holds. It should be checked against independent sources, not accepted because it looks official on a phone screen.</p>
<aside class="bmx-callout"><p><strong>Never let the person selling the property be the only person proving that the property is safe to buy.</strong></p></aside>
<h3>2. Government truth</h3>
<p>Government truth is about what was allowed to be developed, and whether the building matches that permission.</p>
<ul>
<li>What was legally approved to be developed on that land?</li>
<li>Are the relevant Lagos planning and building-control records available?</li>
<li>Does the physical building correspond with the approved plans?</li>
<li>Were extra floors, extensions, structural changes, or a change of use added without a matching record?</li>
<li>Are there missing files or compliance questions that still need an answer?</li>
</ul>
<p>In Lagos, these questions do not all sit in one office. Planning permission for development is handled through the Lagos State Physical Planning Permit Authority (LASPPPA). Building control, including how construction is supposed to be inspected as it proceeds, sits with the Lagos State Building Control Agency (LASBCA). Land-title records are a further record again, held through the state’s land administration system. A clean answer from one of them is not an automatic answer from the others.</p>
<h3>3. Site truth</h3>
<p>Site truth is what is physically there today, not what the brochure remembers.</p>
<ul>
<li>What is standing on the plot?</li>
<li>Does the structure show cracking, movement, damp, or deterioration you would be paying to inherit?</li>
<li>What is the condition of the roof, the electrical installation, the plumbing, and the drainage?</li>
<li>How does the compound sit relative to the road and to neighbouring plots when it rains?</li>
<li>Are expensive repairs hidden behind new finishes?</li>
<li>If the building is unfinished, what can you rely on, and what may need to be corrected before it is completed?</li>
<li>What would it realistically cost to make the property usable, or to complete it properly?</li>
</ul>
<aside class="bmx-checkpoint"><p>If the paper truth, government truth and site truth do not agree, the transaction is not ready simply because the seller is ready.</p></aside>
<p>If you already have a Lagos property in mind, you do not need to remember every question in this guide. Use the Property Purchase Safety Check below. Tell us what you know, what documents you have, and what is making you uneasy. BuildMyHouse can use that brief to recommend the checks that apply to your property and to prepare a proposal. The check itself is an intake. It is not a free legal opinion or a free technical inspection.</p>
`,
  htmlAfterTool: `
<h2>Start with the property, not the asking price</h2>
<p>Price is the easiest number in the conversation and the least useful one at the beginning. Before you negotiate, collect the facts that let someone else identify the property without relying on the seller’s narration.</p>
<p>Ask for:</p>
<ul>
<li>the exact address, estate name, and plot number if there is one;</li>
<li>the seller’s full legal name, and the name of anyone speaking for them;</li>
<li>title documents they say support the sale;</li>
<li>the survey plan, and coordinates if they have them;</li>
<li>approved drawings and planning or building-control documents, where a building already exists;</li>
<li>clear photos and a video that shows the street, the compound, the roof, wet areas, and the back of the building, not only the living room;</li>
<li>for an unfinished project, whatever drawings, approvals, and stage photographs still exist.</li>
</ul>
<p>Write down who sent each file and when. A serious buyer abroad is building a file, not collecting screenshots in a chat that will be hard to reconstruct later.</p>
<p>You can do this part yourself. You should not treat the file as verified just because it is now complete. Collection and verification are different jobs.</p>
<h2>Title verification is more than a certificate that looks genuine</h2>
<p>Lagos buyers often relax when they hear “C of O”. A Certificate of Occupancy is important. It is not, by itself, proof that this seller can transfer this property to you free of problems. Treat it as the start of the enquiry, not the end. Your property lawyer should say what else this particular file still needs.</p>
<p>A proper title check, done for you rather than for the seller, looks at ownership, the seller’s authority, and the chain of how that interest got to them. If a company is selling, someone needs to confirm that the company exists and that the person signing can bind it. If the registered holder has died, “I am the first son” is not authority. Your property lawyer should say what evidence of authority is required in that case.</p>
<p>The same check asks whether the survey belongs to the land in the video. A genuine survey of a different plot is a common way for a real document to describe the wrong ground. A registered surveyor working for you should identify the parcel, not only admire the drawing the agent forwarded.</p>
<p>Government land records matter here. Lagos provides an official land administration portal where property information can be searched and where certified copies can be requested. Your lawyer should use the official route that applies to this file, and should compare what the seller sent with what the registry holds: names, dates, plot identity, survey particulars, and later transactions or encumbrances noted on the record.</p>
<p>Litigation and family disputes will not always appear as a neat stamp on the certificate. Ask the lawyer what searches are realistic for this property, and what a missing answer means. “We did not check” is not the same as “there is nothing to find”.</p>
<p>For a longer walk through land documents, state registries, and why the seller should not appoint every professional in the chain, read <a class="bmx-article-link" href="/land-verification-in-nigeria-guide">how to verify land in Nigeria from abroad</a>. The rule from the start of this guide still applies: never let the person selling the property be the only person proving that it is safe to buy.</p>
<h2>A clean land title does not make the building compliant</h2>
<p>Buyers mix these up because both involve government paper. They are not the same investigation.</p>
<p>Land and title verification asks: who holds the interest in this land, and can it be transferred to me? Building approval and compliance verification asks: what development was permitted here, and is the building that exists the building that was permitted?</p>
<figure class="article-anim"><img src="/articles/property-purchase/title-vs-building.gif" alt="A land title can be in order while the building still has to be compared with what was approved. The drawing and the finished house are both two storeys, and that match still has to be checked on the actual property." width="800" height="1000" /></figure>
<p>You can have a plausible title and an illegal extra floor. You can have a building that looks finished and no planning file anyone can produce. You can have an approval for a different design from the one you walked through on video. Buying the land interest does not, by itself, bless the structure standing on it.</p>
<p>If your plan is to live in the house, rent it, or complete it, you need both answers. A lawyer’s title report does not describe the roof. An engineer’s inspection does not prove the seller owns the land.</p>
<h2>Confirm what Lagos actually approved</h2>
<p>The practical question is plain. <strong>What was this owner allowed to build, and is that what is standing there today?</strong></p>
<p>LASPPPA, the Lagos State Physical Planning Permit Authority, is the planning-permit authority for development in the state. If someone tells you the house was “approved”, ask which permit they mean, for which drawings, and for which plot. Then ask your own professionals to see whether those records can be confirmed, not only photographed.</p>
<p>LASBCA, the Lagos State Building Control Agency, is the building-control authority. Its published inspectorate work includes authorisation before construction proceeds, stage inspection as work goes up, and completion and fitness-for-use certification when the relevant process has been satisfied. A house that has been painted and furnished has not automatically finished that process. A house that was built years ago may have a thin file. The absence of a document is a question, not a slogan. The question is what is missing, and what that gap means for this building.</p>
<p>Read the official explanations rather than an agent’s summary. LASBCA sets out its inspectorate and quality-control role on its own site: <a class="bmx-article-link" href="https://lasbca.lagosstate.gov.ng/service/inspectorate-and-quality-control/">LASBCA inspectorate and quality control</a>. Lagos land records are a separate system: <a class="bmx-article-link" href="https://landonline.lagosstate.gov.ng/index.html">Lagos State land administration portal</a>.</p>
<p>BuildMyHouse has a plainer walkthrough of how those Lagos roles fit together in <a class="bmx-article-link" href="/building-permit-in-lagos-nigeria-guide">the Lagos building-permit guide</a> and in <a class="bmx-article-link" href="/guides/lagos-building-permits-and-stage-inspections">Lagos building permits and stage inspections</a>. Use them to understand the process. Use a property lawyer and the relevant technical professional to apply it to the house you are actually considering.</p>
<p>Do not try to become the planning authority from abroad. Do insist that “it was approved” is tied to a document, a plot, and a drawing that matches the building.</p>
<h2>Inspect the building that is standing there</h2>
<p>A property viewing, a WhatsApp video, and a technical inspection are three different events.</p>
<p>A viewing shows you what the seller wants you to feel. A video is a viewing you cannot steer. A technical inspection is a visit organised to look for the things that cost money after completion: movement in the structure, water paths, roof failure, unsafe electrics, plumbing that does not drain, and finishes that are newer than the problems underneath them.</p>
<aside class="bmx-callout"><p><strong>Fresh paint can hide evidence. Attractive finishes are not technical evidence.</strong></p></aside>
<p>A useful inspection brief for a Lagos house covers at least:</p>
<ul>
<li>visible structural concerns: cracks, settlement, out-of-plumb walls, exposed reinforcement, previous poorly repaired movement;</li>
<li>the roof and the way water is supposed to leave it;</li>
<li>waterproofing at terraces, balconies, bathrooms, and any place a slab is also a roof;</li>
<li>damp, staining, and mould, including rooms that were not in the first video;</li>
<li>windows and doors that do not close, or that show water tracking through the frames;</li>
<li>the electrical installation: distribution, earthing, obvious overheating, and whether what you see could safely serve the way you intend to live;</li>
<li>plumbing and water storage;</li>
<li>sewage and where it goes;</li>
<li>drainage inside the compound, which the next section treats on its own;</li>
<li>the mechanical and electrical systems you would actually inherit, not a brand name on a brochure.</li>
</ul>
<p>A registered surveyor identifying the land is not a structural engineer looking at a cracked frame, and neither replaces an electrical or plumbing assessment when those systems are part of the risk. BuildMyHouse can coordinate the right independent people. It is not your engineer, your electrician, or your lawyer. Ask for dated photographs of defects and a written list of what was seen, what was not opened up, and what still needs a specialist.</p>
<h2>Give drainage and flooding their own check</h2>
<p>In Lagos, “does this area flood?” is too crude to be your only question. Two houses on the same street can behave differently because of how the plot sits, where the neighbour discharges water, and whether the compound has anywhere for rain to go.</p>
<figure class="article-anim"><img src="/articles/property-purchase/lagos-drainage.gif" alt="A Lagos house sits above the road, with the compound sloping toward a drain. Do not only inspect the rooms. Check the road level, the drain, and how the compound sheds water." width="800" height="1000" /></figure>
<p>Look at, or have someone look at:</p>
<ul>
<li>the level of the house and the compound relative to the road;</li>
<li>neighbouring plots that may be higher and may send water toward you;</li>
<li>where roof water and compound water are supposed to discharge;</li>
<li>the drains you can actually see, and whether they are blocked, undersized, or missing;</li>
<li>stains, water marks, silt, or repaired skirtings that suggest water has been inside before;</li>
<li>damp at the base of walls after you have been told the house is “always dry”;</li>
<li>pumps in a compound, and the honest question of what happens when the pump is off or the power is out;</li>
<li>how the compound is described in heavy rain, including by neighbours where it is reasonable to ask.</li>
</ul>
<p>Neighbourhood talk is not a flood study. It can still show a pattern the listing left out. If the seller will only show the house at noon in the dry season, write that limit down. A calm structure can still be a poor buy if the ground floor takes water every rainy season. That cost belongs in the price, not in a surprise after you have paid.</p>
<h2>An unfinished building is a different purchase</h2>
<p>An unfinished house is not a completed house with the furniture missing. You may be buying someone else’s abandoned sequence of decisions: a frame exposed for years, drawings nobody can find, concrete that has been rained on, and a story about how much the previous owner “already spent”.</p>
<aside class="bmx-checkpoint"><p>The useful question is not how much the previous owner already spent. It is how much of what has been built you can safely rely on.</p></aside>
<p>Before you price the “bargain”, ask for the construction history. When did work stop? Why? Which drawings exist, and do they match what is on site? Has anyone independent looked at the structure since it was left open? Exposed reinforcement, cracked lintels, stagnant water on slabs, and unfinished staircases are not decorative details. They are clues about what can stay and what may need to be broken out or strengthened.</p>
<p>Testing is sometimes necessary and sometimes not. An engineer should say which, after seeing the building, rather than you guessing from photographs. The number you need is a cost to complete that includes correction, not only paint, tiles, and a kitchen. Correction is the part sellers leave out because it makes the unfinished building look less cheap.</p>
<p>If you want a longer treatment of taking over a stopped project from another country, read <a class="bmx-article-link" href="/guides/how-to-finish-an-abandoned-house-in-nigeria-from-abroad">how to finish an abandoned house in Nigeria from abroad</a>. The purchase decision and the completion project are related, but they are not the same decision. Verify what you would be buying before you budget what you would build next.</p>
<h2>Turn findings into a buying decision</h2>
<p>Due diligence that ends in a folder of photographs has not finished its job. The findings should change the decision in front of you.</p>
<ul>
<li><strong>Whether to proceed.</strong> If paper, approvals, and the building tell a consistent story, you may have enough to instruct your lawyer on the transfer.</li>
<li><strong>Whether you need a further investigation.</strong> A crack, a missing permit file, or a survey that does not sit on the plot is a reason to pause, not a reason to “sort it after payment”.</li>
<li><strong>Whether to renegotiate.</strong> A roof replacement, a drainage rebuild, or a structural repair is a number. That number belongs against the asking price.</li>
<li><strong>Whether the asking price still makes sense.</strong> A house that needs ₦18 million of correction is not the house in the advert, even if the gate is the same.</li>
<li><strong>Whether to walk away.</strong> Some combinations do not have a comfortable discount. A seller who cannot show authority to sell is not a pricing problem.</li>
</ul>
<p>BuildMyHouse helps you see what was checked, what was found, and what is still open. The decision to buy remains yours, with your lawyer. We do not certify that a property is free of risk, and we do not replace the specialists named in the proposal.</p>
<h2>Four conclusions, not a pile of photographs</h2>
<p>A useful brief ends in one of four places.</p>
<p><strong>Proceed.</strong> The checks you commissioned agree well enough that your lawyer can take the transaction forward. Unresolved items, if any, are minor and written down.</p>
<p><strong>Proceed subject to conditions.</strong> You can continue only if specific gaps close first. That might be a certified registry copy, a revised drawing, a structural repair method, or a drainage correction. The condition should be concrete enough that you know when it has been met.</p>
<p><strong>Renegotiate.</strong> You still want the property, but the findings have a cost. The price, the deadline, or what the seller must fix before completion has to move.</p>
<p><strong>Do not proceed in its present state.</strong> The paper, the approval record, or the building does not support the purchase you were offered. That is a complete outcome. It is often the one that saves the most money.</p>
<p>None of these predicts the neighbourhood’s future or describes work nobody opened up. They stop a WhatsApp thread from being the only record of why you paid.</p>
<h2>Do not let seller urgency replace the checks</h2>
<p>Urgency is common because it works on people who are far away. You will hear versions of:</p>
<ul>
<li>“Another buyer is interested.”</li>
<li>“The price changes next week.”</li>
<li>“The owner is travelling.”</li>
<li>“Send something so they know you are serious.”</li>
</ul>
<p>A real second buyer does not repair a title defect. A deadline does not create a planning permit. A boarding pass does not explain a crack. A deposit paid to “show seriousness” is still money, and it is often paid before the checks that should have decided whether the property was a candidate at all.</p>
<p>You can be polite and still be sequential. Tell the seller you are interested, and that independent verification comes before a meaningful payment. A seller who has authority and a coherent building can usually wait for a defined due-diligence period. A seller who can only sell if you do not look is telling you something, even if the video was beautiful.</p>
<h2>Inspection is not the transfer of ownership</h2>
<p>When the checks support a purchase, the purchase still has to be done properly. An inspection report is not a deed. A BuildMyHouse summary is not Governor’s consent, stamp duty, or registration.</p>
<p>Your property lawyer should guide the transaction documents and the perfection and registration steps that apply to this deal. What those steps are depends on the interest being sold and on the current Lagos process. Do not take that list from an agent’s voice note. The <a class="bmx-article-link" href="https://landonline.lagosstate.gov.ng/index.html">Lagos land administration portal</a> is the public front door for land records. Your lawyer should confirm which applications this transaction actually requires.</p>
<p>BuildMyHouse can coordinate the due-diligence information that sits around that legal work: what was collected, who inspected, what they found, and what remains open. We do not replace your lawyer, and we do not decide the purchase for you.</p>
<h2>The three truths, in one place</h2>
<p><strong>Paper truth.</strong> Who owns the interest, who is allowed to sell it, what the history shows, and whether the survey is the same land as the compound in the video.</p>
<p><strong>Government truth.</strong> What LASPPPA and LASBCA records say was allowed, and whether the building you would inherit still corresponds to those records.</p>
<p><strong>Site truth.</strong> What a proper look at the structure, the roof, the services, the damp, and the drainage shows it will cost to live with, finish, or repair.</p>
<p>If those three do not agree, the seller’s readiness is not your readiness.</p>
<h2>How BuildMyHouse helps when you are abroad</h2>
<p>BuildMyHouse is not the seller, the estate agent, the developer, or the contractor who built the house. It is a project-control layer. For a purchase, that means helping you run the checks in an order you can follow from another country.</p>
<p>On a serious instruction, the work can include:</p>
<ul>
<li>an initial intake of the property and of what is worrying you;</li>
<li>collection of the documents and media you already have;</li>
<li>coordination with the independent professionals the property actually needs, such as a property lawyer, a registered surveyor, a structural engineer, or an electrical, plumbing, or drainage specialist;</li>
<li>title and property verification through those professionals, not through the seller’s cousin;</li>
<li>a physical inspection, with photo and video tied to findings rather than to the sales tour;</li>
<li>a review of approval documents where they exist;</li>
<li>a written note of technical findings, unresolved questions, and likely corrective work;</li>
<li>an acquisition-readiness summary you can read against the four conclusions above;</li>
<li>a proposal for the next step, including the specialist work that has to be paid for.</li>
</ul>
<p>The Property Purchase Safety Check on this page does not do that work. It organises your facts so a proposal can be specific. Lawyers, surveyors, engineers, and site inspections are professional services. They are quoted. They are not included because you filled in a form.</p>
<p>If you later buy the property and it needs repairs, renovation, completion, or new construction, that is a separate project. BuildMyHouse can then manage it through the normal project workflow: scope, stages, evidence, and payments you approve. You can <a class="bmx-article-link" href="/start">start that project</a> when you are ready. Background on the work itself sits on <a class="bmx-article-link" href="/construction/lagos">house construction in Lagos</a> and <a class="bmx-article-link" href="/renovation/nigeria">renovation in Nigeria</a>.</p>
<p>More of the library is on <a class="bmx-article-link" href="/articles">BuildMyHouse articles</a>.</p>
`,
  htmlFaq: `
<h2>Questions buyers abroad actually ask</h2>
<h3>How do I verify a property before buying in Lagos?</h3>
<p>Separate the checks. Confirm who can sell the interest, whether the survey matches the plot, what Lagos planning and building-control records exist for the building, and what an independent inspection says about structure, services, and drainage. Do not treat the seller’s document pack as the verification.</p>
<h3>Can I buy property in Lagos while living abroad?</h3>
<p>Yes. You can collect documents, appoint your own lawyer and surveyor, and have the building inspected while you remain abroad. Some registry steps still need a representative in Lagos. Distance is a reason to be more systematic, not a reason to skip the checks.</p>
<h3>Who should verify land documents before I buy?</h3>
<p>A property lawyer acting for you should investigate title, authority to sell, and the registry position. A registered surveyor acting for you should tie the survey to the physical plot. The seller’s own lawyer and surveyor can explain the seller’s papers. They should not be the only people checking them.</p>
<h3>Is a Certificate of Occupancy enough to prove a property is safe to buy?</h3>
<p>No. It is important evidence of a right, and it can still sit on top of an incomplete history, the wrong parcel, an encumbrance, or a building that was not what the title file imagines. Read it with the chain of title, the survey, and the building in front of you.</p>
<h3>How do I check whether a building in Lagos has approval?</h3>
<p>Ask which approval is being claimed, for which drawings and which plot. LASPPPA handles planning permission for development. LASBCA handles building control, including inspection as work proceeds and completion certification. Have your own professionals compare those records with the building, instead of relying on a photograph of a stamp.</p>
<h3>Should I inspect a house before paying a deposit?</h3>
<p>Yes, before any payment large enough that you would miss it. A reservation or “seriousness” deposit made before title, approval, and condition checks is how buyers abroad fund a decision they have not finished making.</p>
<h3>How do I check whether a Lagos property floods?</h3>
<p>Do not stop at the neighbourhood’s reputation. Compare the house and compound with the road and with neighbouring plots, follow the drains, look for old water marks and damp, and ask how the compound behaves in heavy rain, including what happens if a pump stops. A dry-season viewing is not a wet-season test.</p>
<h3>What should I check before buying an unfinished building?</h3>
<p>Ask how long it has been stopped, which drawings and approvals exist, whether the exposed structure has deteriorated, and what an engineer believes you can keep. Price the cost to complete, including correction. Ignore the seller’s story about what they already spent until you know what you can rely on.</p>
<h3>Can BuildMyHouse inspect a property for me while I am abroad?</h3>
<p>BuildMyHouse can coordinate an inspection and the other independent checks the property needs, and can send you a structured record of what was found. The inspection itself is done by the appropriate professionals. It is scoped and quoted. It is not a free add-on to this article.</p>
<h3>What happens if an inspection finds defects?</h3>
<p>The defects should change the decision: proceed only with conditions, renegotiate around the cost, investigate further, or do not proceed in the property’s present state. Photographs without a decision are not the end of the work.</p>
<h3>Can BuildMyHouse help me after I purchase the property?</h3>
<p>Yes, as a separate project. If the house needs repairs, renovation, completion, or new construction, BuildMyHouse can manage that work with scope, stages, and evidence. Buying the property and building or repairing it are not the same instruction.</p>
<h2>A note on what this guide is not</h2>
<p>This is practical education for a buyer who cannot be in Lagos this week. It is not formal legal advice, a survey, or an engineering opinion on a specific property. Registry practice and agency procedure change. Confirm current requirements with the relevant Lagos authority and with a qualified property lawyer before you pay. BuildMyHouse coordinates checks and, later, project work. It does not guarantee that a property is free of fraud, defects, or risk.</p>
`,
  faq: {
    title: 'Questions buyers abroad actually ask',
    items: [
      {
        question: 'How do I verify a property before buying in Lagos?',
        answer:
          'Separate the checks. Confirm who can sell the interest, whether the survey matches the plot, what Lagos planning and building-control records exist for the building, and what an independent inspection says about structure, services, and drainage. Do not treat the seller’s document pack as the verification.',
      },
      {
        question: 'Can I buy property in Lagos while living abroad?',
        answer:
          'Yes. You can collect documents, appoint your own lawyer and surveyor, and have the building inspected while you remain abroad. Some registry steps still need a representative in Lagos. Distance is a reason to be more systematic, not a reason to skip the checks.',
      },
      {
        question: 'Who should verify land documents before I buy?',
        answer:
          'A property lawyer acting for you should investigate title, authority to sell, and the registry position. A registered surveyor acting for you should tie the survey to the physical plot. The seller’s own professionals should not be the only people checking the sale.',
      },
      {
        question: 'Is a Certificate of Occupancy enough to prove a property is safe to buy?',
        answer:
          'No. It is important evidence of a right, and it can still sit on top of an incomplete history, the wrong parcel, an encumbrance, or a building that does not match what was approved. Read it with the chain of title, the survey, and the building itself.',
      },
      {
        question: 'How do I check whether a building in Lagos has approval?',
        answer:
          'Ask which approval is claimed, for which drawings and which plot. LASPPPA handles planning permission for development. LASBCA handles building control, including stage inspection and completion certification. Have your own professionals compare those records with the building.',
      },
      {
        question: 'Should I inspect a house before paying a deposit?',
        answer:
          'Yes, before any payment large enough that you would miss it. A deposit paid to look serious, before title, approval, and condition checks, is money spent before the decision is finished.',
      },
      {
        question: 'How do I check whether a Lagos property floods?',
        answer:
          'Compare the house and compound with the road and neighbouring plots, follow the drains, look for old water marks and damp, and ask how the compound behaves in heavy rain, including if a pump stops. A dry-season viewing is not a wet-season test.',
      },
      {
        question: 'What should I check before buying an unfinished building?',
        answer:
          'Ask how long work has been stopped, which drawings and approvals exist, whether the exposed structure has deteriorated, and what you can safely keep. Price the cost to complete, including correction, not the amount the previous owner says they spent.',
      },
      {
        question: 'Can BuildMyHouse inspect a property for me while I am abroad?',
        answer:
          'BuildMyHouse can coordinate an inspection and the other independent checks the property needs, and can send you a record of what was found. The inspection is done by the appropriate professionals, scoped and quoted. It is not a free add-on to this article.',
      },
      {
        question: 'What happens if an inspection finds defects?',
        answer:
          'The findings should change the decision: proceed only with conditions, renegotiate around the cost, investigate further, or do not proceed in the property’s present state.',
      },
      {
        question: 'Can BuildMyHouse help me after I purchase the property?',
        answer:
          'Yes, as a separate project. If the house needs repairs, renovation, completion, or new construction, BuildMyHouse can manage that work with scope, stages, and evidence.',
      },
    ],
  },
  internalLinks: {
    title: 'Related BuildMyHouse guides',
    links: [
      { label: 'How to verify land in Nigeria from abroad', href: '/land-verification-in-nigeria-guide' },
      { label: 'Building permit in Lagos', href: '/building-permit-in-lagos-nigeria-guide' },
      { label: 'Lagos building permits and stage inspections', href: '/guides/lagos-building-permits-and-stage-inspections' },
      { label: 'Finish an abandoned house from abroad', href: '/guides/how-to-finish-an-abandoned-house-in-nigeria-from-abroad' },
      { label: 'House construction in Lagos', href: '/construction/lagos' },
      { label: 'Renovation in Nigeria', href: '/renovation/nigeria' },
      { label: 'Build opportunities in Nigeria', href: '/build-opportunities-nigeria' },
      { label: 'All articles', href: '/articles' },
      { label: 'Start a project after you buy', href: '/start' },
    ] as InternalLinkItem[],
  },
} as const;

export function getPropertyPurchaseLagosSchema() {
  const content = propertyPurchaseLagosDueDiligenceContent;
  const graph = buildSeoJsonLd({
    path: PROPERTY_PURCHASE_ARTICLE_PATH,
    title: content.hero.title,
    description: content.seo.description,
    schemaType: 'Article',
    image: content.coverImage.src,
    faqs: content.faq.items.map((item) => ({ question: item.question, answer: item.answer })),
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Articles', path: '/articles' },
      { name: 'Buying property in Lagos from abroad', path: PROPERTY_PURCHASE_ARTICLE_PATH },
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

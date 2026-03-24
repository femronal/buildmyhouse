# BuildMyHouse ChatGPT Prompt Library

Use this with `BUILDMYHOUSE_CHATGPT_CODEBASE_REFERENCE.md` attached as a source.

Tip: Start prompts with "Based on my attached BuildMyHouse codebase reference..."

---

## 1) Core System Understanding Prompts

### 1.1 Explain a feature end-to-end

```text
Based on my attached BuildMyHouse codebase reference, explain how [FEATURE] works end-to-end across:
1) Homeowner app
2) GC app
3) Admin dashboard
4) Backend modules and data model

Include:
- Key user flows
- Main API/data dependencies
- Operational risks
- 5 practical improvements
```

### 1.2 Compare two product areas

```text
Based on my attached BuildMyHouse codebase reference, compare [AREA A] vs [AREA B].

Give:
- Current implementation differences
- Product implications
- Engineering complexity for each
- Recommended priority (with reasons)
```

### 1.3 Find implementation gaps

```text
Based on my attached BuildMyHouse codebase reference, identify likely implementation gaps in [AREA].

Output:
- Gap
- Why it matters (user/business impact)
- Severity (low/medium/high)
- Suggested fix
- Estimated effort (S/M/L)
```

---

## 2) Marketing Prompts

### 2.1 Website messaging from real product

```text
Based on my attached BuildMyHouse codebase reference, write homepage copy that accurately reflects what the product already does today.

Deliver:
- Hero headline + subheadline
- 6 feature bullets by user type (Homeowner, Contractor, Admin)
- "How it works" 3-step section
- Trust/safety section
- CTA variants for:
  - BuildMyHouse homeowner app
  - GC app
```

### 2.2 Positioning and ICP messaging

```text
Based on my attached BuildMyHouse codebase reference, create positioning for:
1) New homeowners in Lagos
2) Verified general contractors
3) Real estate operators/listing managers

For each audience:
- Core pain points
- Value proposition
- Objections and responses
- Top 3 proof points from current platform capabilities
```

### 2.3 Social content engine

```text
Based on my attached BuildMyHouse codebase reference, generate a 30-day social content calendar.

Constraints:
- 3 posts/week
- Mix: education, trust, proof, product walkthrough
- Include hooks, captions, and CTA for each post
- Keep all claims consistent with current implementation
```

### 2.4 Landing page for one feature

```text
Based on my attached BuildMyHouse codebase reference, write a conversion landing page for [FEATURE, e.g. "Admin verification workflow" or "Homeowner project tracking"].

Include:
- Headline/subheadline
- Problem agitation
- Feature breakdown
- FAQ
- CTA variants
```

---

## 3) Operations Management Prompts

### 3.1 SOP generation

```text
Based on my attached BuildMyHouse codebase reference, create an SOP for [PROCESS].

Examples of process:
- Handling homeowner complaints
- Reviewing contractor verification
- Resolving project disputes
- Handling failed payment reports

SOP format:
1) Purpose
2) Owner/role
3) Inputs required
4) Step-by-step procedure
5) Escalation paths
6) SLA targets
7) KPI tracking
```

### 3.2 Incident playbook

```text
Based on my attached BuildMyHouse codebase reference, create an incident response playbook for [INCIDENT TYPE].

Examples:
- Backend downtime
- Auth/login failure
- Stripe webhook delays
- Notification delivery issues

Include:
- Detection signals
- Immediate triage checklist
- User communication templates
- Recovery steps
- Postmortem template
```

### 3.3 Ops dashboard KPI design

```text
Based on my attached BuildMyHouse codebase reference, define an operations KPI dashboard.

Group KPIs into:
- Growth
- Marketplace liquidity
- Project execution health
- Payment reliability
- Support quality

For each KPI include:
- Formula
- Data source likely available from current architecture
- Why it matters
- Target threshold
```

### 3.4 Support triage matrix

```text
Based on my attached BuildMyHouse codebase reference, design a support triage matrix.

Output columns:
- Issue type
- Severity
- First responder team
- Resolution owner
- Response SLA
- Resolution SLA
- Escalation trigger
```

---

## 4) Investor/Board Prompts

### 4.1 Investor update draft

```text
Based on my attached BuildMyHouse codebase reference, draft a monthly investor update.

Sections:
- Product progress (shipped capabilities grounded in current implementation)
- Operational milestones
- Key risks and mitigations
- Next 30/60/90 day priorities
- Specific asks (hiring, intros, partnerships)
```

### 4.2 Fundraising narrative from product maturity

```text
Based on my attached BuildMyHouse codebase reference, write a fundraising narrative showing:
- Why now
- Why this team
- Why this architecture is hard to replicate
- Wedge strategy and expansion roadmap

Keep it credible to current implementation (no fake claims).
```

### 4.3 Due diligence readiness

```text
Based on my attached BuildMyHouse codebase reference, create a technical due diligence readiness checklist.

Include:
- Architecture documentation status
- Security/auth readiness
- Deployment/CI reliability
- Data integrity and migration controls
- Operational resilience
- Gaps to close before diligence
```

---

## 5) Customer Support and CX Prompts

### 5.1 Customer reply templates

```text
Based on my attached BuildMyHouse codebase reference, write customer support reply templates for:
- Homeowner cannot login
- Contractor verification pending
- Payment marked failed
- Viewing interest not updated
- Dispute status confusion

Tone: empathetic, concise, confident.
```

### 5.2 Help center article generation

```text
Based on my attached BuildMyHouse codebase reference, write a help center article for [TOPIC].

Use this structure:
- Who this is for
- Prerequisites
- Steps
- Common issues
- Contact support
```

### 5.3 In-app notification copy

```text
Based on my attached BuildMyHouse codebase reference, propose push/in-app notification copy for:
- New project request
- Verification approved/rejected
- Payment completed/failed
- New chat message
- Dispute updated

Provide short and long variants.
```

---

## 6) Product Strategy Prompts

### 6.1 Prioritization matrix

```text
Based on my attached BuildMyHouse codebase reference, prioritize the next 10 features using:
- User impact
- Revenue impact
- Strategic moat
- Engineering effort
- Operational complexity

Output:
- Ranked list
- Rationale
- Suggested quarter roadmap
```

### 6.2 Expansion strategy

```text
Based on my attached BuildMyHouse codebase reference, suggest expansion opportunities beyond current features.

For each idea:
- Problem solved
- Required architecture changes
- New risks
- Time to MVP
- Revenue potential
```

### 6.3 Retention improvement plan

```text
Based on my attached BuildMyHouse codebase reference, generate a retention strategy for:
1) Homeowners
2) Contractors

Include:
- Activation milestones
- Habit loops
- Lifecycle messaging
- Product/ops interventions
```

---

## 7) Team Execution Prompts

### 7.1 Weekly leadership brief

```text
Based on my attached BuildMyHouse codebase reference, generate a weekly leadership brief.

Sections:
- This week's wins
- Risks/blockers
- Customer pain signals
- Engineering + ops focus next week
- Decisions needed from leadership
```

### 7.2 Cross-functional task breakdown

```text
Based on my attached BuildMyHouse codebase reference, break down [INITIATIVE] into:
- Product tasks
- Engineering tasks
- Operations tasks
- Marketing tasks
- Dependencies
- Suggested timeline
```

### 7.3 Hiring plan by bottlenecks

```text
Based on my attached BuildMyHouse codebase reference, infer likely bottlenecks and propose a 6-month hiring plan.

Include:
- Role
- Why now
- Expected impact
- Priority level
```

---

## 8) Prompt Add-Ons (Reusable)

Add these to any prompt when needed:

- "Be strict about what is already implemented vs what is a recommendation."
- "Call out assumptions clearly."
- "Separate immediate actions (0-30 days) from medium-term actions (31-90 days)."
- "Output in a table first, then strategic commentary."
- "Use Nigeria/Lagos market context where relevant."

---

## 9) Best Practice Workflow

1. Attach `BUILDMYHOUSE_CHATGPT_CODEBASE_REFERENCE.md` first.  
2. Paste one prompt from this file.  
3. Add your business context (goal, audience, timeline).  
4. Ask for 2-3 alternatives before finalizing.  
5. Request final output in implementation format (SOP, checklist, calendar, script, etc.).

---

This prompt companion is designed to help you turn your codebase context into practical outputs for marketing, operations, product strategy, investor communication, and customer experience.

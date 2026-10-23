# BMH money trackers: product mechanics brief

**Status:** mechanics + Compliance Watch final UI labels locked 2026-10-23. Ready for Cursor prompt.  
**Repo checked:** `femronal/buildmyhouse` @ `644b1f3` (pulled 2026-10-23, Europe/Istanbul).  
**Trigger:** live job BMH-U-4160 (Bed and TV Console), GC Ajusco Fix / Olamilekan Ajulo. Materials and advances inside a stage do not move GC "Paid to you / Left on this job / Full job price".  
**Audience:** Product Ops, Job Ops, Compliance Watch, Cursor implementer.  
**Sample layout (GC card):** `/workspace/bmh-money-tracker/gc-money-tracker-sample.jpg` (from Job Ops; title/price in sample are fake).  
**Compliance artifact:** `/workspace/bmh-compliance/money-ui/2026-10-23-gc-ho-money-ui-labels.md`.  
**Note:** `compliance-watch-request.md` in this folder is obsolete (labels delivered).

Final UI strings (Compliance Watch, 23 Oct). Do not invent alternatives. Hard rejects: escrow, trust account, safeguarded/guaranteed/insured/protected funds, "still owed to you", rejected lines on GC/HO cards. Do not use "Waiting" or "Waiting for you" for the leftover money number.

**GC card:** section title **Money for this job**; **Paid to you**; **Left on this job**; **Full job price**; **Paid to shops**; helper **Shop pays are separate from paid to you.**

**HO summary:** section **Your money on this job**; **You sent in**; **Still with BuildMyHouse**; **Sent to your contractor**; **Paid to shops for materials**.

---

## 1. What the code does today

### 1.1 GC money card today (`gc-project-detail.tsx`)

Layout already matches Job Ops sample order. Ship will rename labels to Compliance Watch finals.

1. Progress ("Job X% done") sits **above** the money card.
2. Card title today: "Your money for this job" → ship as **Money for this job**.
3. Two tiles today: Paid to you | Waiting → ship as **Paid to you** | **Left on this job**.
4. Job price under them → ship as **Full job price**.
5. Homeowner + Call / Message below.
6. Add v1 line: **Paid to shops** + helper **Shop pays are separate from paid to you.**

Numbers come from `getGCEarnings` (`contractors.service.ts`):

| UI field | Source today |
| --- | --- |
| Paid to you | `earned` = `project.spent` |
| Waiting (today; ship as Left on this job) | `pending` = `max(0, project.budget - project.spent)` |
| Job price | `project.budget` |

So Paid + Waiting = Job price **only if** `spent` never exceeds `budget` (today; ship uses payout lines).

### 1.2 How `project.spent` is set (two writers, different meanings)

1. **Stage completion sync** (`projects.service.ts` `syncProjectAfterStageChange`):  
   `spent = sum(estimatedCost of stages with status === 'completed')`.  
   This **overwrites** `spent`. It does not read materials, team, or Payment rows.

2. **Stripe payment success** (`payments.service.ts` `handlePaymentSuccess`):  
   `spent: { increment: payment.amount }` on completed Payment.  
   This can disagree with (1) the next time a stage status changes.

Neither path reads `StageMaterial` or `StageTeamMember`.

### 1.3 Materials and team on a stage

**`StageMaterial`** (schema + `CreateStageMaterialDto` + admin Materials tab):

- Fields: name, brand, quantity, unit, unitPrice, totalPrice, supplier, contacts, receipt/photo, deliveryDate, notes.
- **Missing:** payee kind, payment status, paidAt, bank/payee identity, link to "this is an advance vs shop buy".
- `addStageMaterial` only creates the row and notifies the homeowner. It does **not** change `stage.estimatedCost`, `project.spent`, or budget.

**`StageTeamMember`:**

- Fields: name, role, phone, email, dailyRate, dates, invoice, notes.
- Earnings API rolls `teamTotal` as `dailyRate * days`.
- **Missing:** paid vs unpaid, amount actually paid, paidAt.
- Does not move Paid to you / Left on this job.

Earnings also returns `materialsTotal` and `teamTotal` as side totals. GC Earnings screen can show them. They are **not** folded into Paid to you / Left on this job on the project card.

### 1.4 Homeowner money views

There is **no** dedicated "final summary" that shows: HO sent in → still held by BMH → sent to contractor.

Closest today:

- **Project dashboard Financial Summary** (`dashboard.tsx`): Total Budget / Spent / Remaining.  
  Spent = sum of completed stages' `estimatedCost` (same stage-complete idea), fallback `project.spent`.
- **Finance tab:** Spent / Remaining from `project.spent` vs budget.
- **Home card copy** already says money is held by BuildMyHouse and paid stage by stage (Compliance Watch owns that language).
- **`Payment` model:** inbound HO payments (amount, status, method, optional stageId). No payee field for "paid out to GC vs shop".

### 1.5 What exists vs missing for "paid out inside stage"

| Need | Exists? |
| --- | --- |
| Stage price envelope (`Stage.estimatedCost`) | Yes |
| Project job price (`Project.budget`) | Yes |
| Log of materials / advances as rows | Yes (`StageMaterial`) but statusless |
| Extra crew cost estimate | Yes (`StageTeamMember.dailyRate`) but unpaid |
| HO money in (`Payment` completed) | Yes (inbound only) |
| Mark line paid to artisan vs shop | **No** |
| planned / invoiced / paid / rejected | **No** |
| paidAt | **No** |
| Outbound payout ledger (BMH bank → GC/shop) | **No** (do not invent one in v1) |
| Auto reduce stage remaining when material added | **No** (prior Product Ops finding; still true) |

---

## 2. Live case: BMH-U-4160 bed stage (₦130,000)

These are ops examples for the data model. Not marketing claims.

| Line | Kind | Amount | Who | Ops status | Counts toward Paid to you? |
| --- | --- | --- | --- | --- | --- |
| Transport / mobilisation | Advance to artisan | ₦15,000 | Ajusco (Zenith) | Paid | **Yes** |
| Foam (Olaneye Mushin) | Material shop | ₦30,000 | Femi paid shop | Paid | **No** → shops line |
| Fabric (Emarson Ladipo) | Material shop | ₦19,800 | Shop | Invoice logged, payment unconfirmed | No until `paid` |
| Hardware (Shatayo Ladipo) | Material shop | ₦11,600 | Shop | Invoice logged | No until `paid` |
| Cutting fee | Advance / service to artisan | ₦2,500 | Ajusco | Agreed to pay | **Yes when `paid`** |
| Mrs M. Alabi wood | Not BMH pay | ₦47,000 | Wood on artisan | Rejected; removed from stage materials | Never |

After install + Fame approval: remaining wood + labour (~₦51,100 if foam/fabric/hardware/cutting/transport counted as above) pays to the artisan.

**No extra team member payouts on this job yet.** Model must still support them (Femi asked).

**Critical rule (Job Ops):** shop pays and artisan pays stay distinct. **Paid to you only rises for money that actually went to the GC / artisan.** Required v1 separate **Paid to shops** line for transparency without inflating Paid to you.

---

## 3. Proposed data model (v1, no new bank ledger)

Extend `StageMaterial` for materials, advances and shop buys rather than inventing a full ledger. Add fields for payee and status. Use `StageTeamMember` for extra crew / external labour, with a small paid extension.

**Locked (Femi, 2026-10-23):** do **not** rename the admin Materials tab. Materials stay separate from external labour / subcontractors (team). Files (videos, photos, invoices) that explain each project stay their own concern; do not merge them into money lines.

### 3.1 Extend `StageMaterial`

Add:

- `payeeKind`: `artisan` | `shop` | `other` (required on create/edit going forward; backfill existing rows as `shop` or `other` with admin review).
- `status`: `planned` | `invoiced` | `paid` | `rejected` (default `planned`).
- `paidAt`: DateTime? (set when status → `paid`; clear if reverted).
- `hoPaymentRef`: String? (optional; ops pastes the payment ID from the matching HO receipt so a payout can be traced to the homeowner money that funded it. Locked answer 5.)
- Optional later (nice, not blocking): `payeeName`, `payeeBankHint`, `paidByAdminId`.

Note: the payee for materials is already captured by `payeeKind`; materials do not need a separate `paidBy`.

Keep existing name / quantity / unitPrice / totalPrice / supplier / receiptUrl / notes.

**Semantics for BMH-U-4160:**

- Transport ₦15k → `payeeKind=artisan`, `status=paid`, `paidAt=...`
- Foam / fabric / hardware → `payeeKind=shop`, status `paid` or `invoiced`
- Cutting ₦2.5k → `payeeKind=artisan`, `status=planned` or `invoiced` until paid
- Rejected wood → `status=rejected` (or deleted); rejected lines never enter sums

### 3.2 Extra team pay (include even if unused on 4160)

Extend `StageTeamMember` with:

- `payStatus`: `planned` | `invoiced` | `paid` | `rejected` (default `planned`)
- `paidAmount`: Float? (if null when paid, use computed dailyRate * days)
- `paidAt`: DateTime?
- `paidBy`: `bmh` | `gc` (required when `payStatus=paid`; locked answer 4)
- `hoPaymentRef`: String? (same as on `StageMaterial`)

Only team rows with `payStatus=paid` **and** `paidBy=bmh` count toward Paid to you and money moved off the job. A helper the GC paid from his own pocket (`paidBy=gc`) must **not** raise Paid to you and must not shrink Left on this job; it can be shown in admin as GC-side cost. The stage budget must be respected: admin should warn when BMH-paid lines on a stage exceed `Stage.estimatedCost`.

Do **not** require a separate `ExtraTeamPay` table in v1.

### 3.3 How to calculate without a ledger

Define sums from **marked lines only**. Trust depends on admin entering truth.

For one project:

```
JOB_PRICE          = Project.budget  (= UI "Full job price")
ARTISAN_PAID       = sum(StageMaterial.totalPrice where payeeKind=artisan AND status=paid)
                   + sum(StageTeamMember paid amounts where payStatus=paid AND paidBy=bmh)
SHOP_PAID          = sum(StageMaterial.totalPrice where payeeKind=shop AND status=paid)
OTHER_PAID         = sum(StageMaterial.totalPrice where payeeKind=other AND status=paid)

Paid to you        = ARTISAN_PAID
Paid to shops      = SHOP_PAID
MONEY_MOVED        = ARTISAN_PAID + SHOP_PAID + OTHER_PAID
Left on this job   = max(0, JOB_PRICE - MONEY_MOVED)
```

Identity to protect:

`Paid to you + Paid to shops + OTHER_PAID + Left on this job = Full job price`
(when no overpay; clamp or flag if over).

**Recalculation (locked answer 1):** these sums are recomputed automatically whenever a material or external-labour line is added, edited, re-statused or removed. No cached total that only updates on stage complete. Lines with `status=rejected` never enter any sum.

**Left on this job (locked answer 2):** subtracts shop pays too, because artisans tend to spend over the stage budget and this number must show only money not yet moved off the job. Never label this "Waiting" or "Waiting for you".

**Do not** also add full `stage.estimatedCost` into Paid to you when the stage completes if those same naira were already recorded as artisan/shop lines. That is the main double-count trap (see §6).

**Stage remaining (admin / stage detail, separate from GC card):**

```
STAGE_PRICE     = Stage.estimatedCost
STAGE_MOVED     = sum(paid+invoiced? lines on that stage; product choice: only `paid`, or `paid`+`invoiced`)
STAGE_REMAINING = max(0, STAGE_PRICE - sum(non-rejected lines that count against the envelope))
```

Recommended for "remaining to pay artisan after Fame": count only `status=paid` against the envelope for cash truth; show `invoiced` as "logged, not paid yet".

### 3.4 Homeowner three-way summary

```
You sent in                 = sum of HO receipts / completed inbound Payment for the project (locked answer 5)
Sent to your contractor     = ARTISAN_PAID   # same as Paid to you
Paid to shops for materials = SHOP_PAID
Still with BuildMyHouse     = max(0, You sent in - Sent to your contractor - Paid to shops for materials - OTHER_PAID)
```

If HO has prepaid the full job and BMH pays shops/GC over time, Still with BuildMyHouse shrinks as lines flip to `paid`. Source of You sent in is the **HO receipts** (completed `Payment` rows plus admin-logged receipts for external transfers). Ops can copy the payment ID from an HO receipt into `hoPaymentRef` on the matching payout line to trace it. If receipts are missing, the summary must show Not enough records yet rather than invent numbers.

### 3.5 Migration from today's `spent`

- Stop using `project.spent` as the meaning of "paid to GC".
- Keep `spent` temporarily for old screens, or redefine it in one follow-up ticket to equal `money moved off the job` or `Paid to you` (choose one; document it). Prefer a dedicated earnings DTO field so UI does not keep calling "spent" earned.
- Stage-complete sync must **not** overwrite a payout-based total with sum(estimatedCost) once payout lines are source of truth.

---

## 4. UI structure (Compliance Watch final labels)

### 4.1 GC project card (keep layout Job Ops / sample)

Order:

1. Progress: Job X% done (above money card).
2. Section title: **Money for this job**.
3. Row / tiles:
   - **Paid to you** → big number (artisan paid only).
   - **Left on this job** → big number (Full job price minus money moved).
4. **Full job price** under tiles.
5. Secondary line (**required for v1**, locked answer 3): **Paid to shops** (= SHOP_PAID). Does **not** increase Paid to you.
6. Helper text under shops: **Shop pays are separate from paid to you.**
7. Homeowner name + Call / Message.

Tap-through (later, not required for first ship): list of artisan paid lines vs shop lines in plain words.

Low-literacy bar: large numbers (16px+ labels), short words, icons, no jargon. Never "Waiting" / "Waiting for you" for the leftover number.

### 4.2 Homeowner final summary (new or replace Financial Summary)

Section title: **Your money on this job**.

Primary rows:

1. **You sent in**  
2. **Still with BuildMyHouse**  
3. **Sent to your contractor**  

Fourth row (v1): **Paid to shops for materials**.

Update whenever a line becomes `paid` or a completed Payment is recorded. Same stage-complete-only behaviour as today is **not** enough. If receipts are missing, show **Not enough records yet** rather than invent numbers.

### 4.3 Admin (required for numbers to be true)

Materials tab (and team tab) must capture:

- payeeKind (artisan / shop / other)
- status (planned / invoiced / paid / rejected)
- paidAt when paid
- Keep receipt / supplier
- Team tab: payStatus, paidAmount, paidAt, **paidBy (BMH / GC)**
- Optional `hoPaymentRef` on both
- Rejected lines stay visible **in admin only**; GC and HO apps never show them (not even as "cancelled"). Locked answer 6.
- Tab names unchanged (Materials stays Materials).

Without admin marking `paid`, GC and HO trackers will understate payouts (today's Ajusco problem continues).

---

## 5. What admin must enter for numbers to be true

1. Every real BMH payout inside a stage is a line with correct **payeeKind**.
2. Status moves to **`paid`** only when money has actually left BMH (or Femi/ops confirms cash paid).
3. Shop invoices that are not yet paid stay **`invoiced`**, not `paid`.
4. Non-BMH costs (wood on artisan) stay **`rejected`** or deleted; never `paid`.
5. Extra crew: team row with **`payStatus=paid`**, amount and **`paidBy`** (BMH or GC). Only BMH counts.
6. HO inbound: HO receipts logged so You sent in is real; copy the receipt payment ID onto matching payouts.
7. Stage `estimatedCost` stays the **envelope** for the stage; it is not a silent substitute for payout lines.

---

## 6. Risks

### 6.1 Double-counting stage clear + material payouts

If Paid to you = ARTISAN_PAID **and** you still add full `estimatedCost` on stage complete, Ajusco would see transport + cutting + full ₦130k stage. **Forbidden.**

Mitigations:

- Source of truth for Paid to you / Left on this job = payout lines only.
- **Locked (answer 1):** stage complete does **not** auto-create a remainder line and does not add anything to the totals. When BMH pays the leftover labour, admin logs it as a normal line; totals recalculate on every add/change. No silent auto-complete remainder.

### 6.2 Shop money inflating "Paid to you"

Must not happen. Filter `payeeKind=artisan` (plus paid team) only.

### 6.3 Left on this job definition

Resolved (answer 2): Left on this job = Full job price minus all money moved off the job (artisan + shops + other paid). Shops shown separately on the GC card. Do not call it Waiting.

### 6.4 `spent` dual writers

Stripe increment + stage-complete overwrite already fight each other. Payout-based earnings must not keep using `spent` as "paid to GC" without a cleanup ticket.

### 6.5 Compliance / trust copy

Final labels locked by Compliance Watch (23 Oct). Hard rejects: escrow, trust account, safeguarded/guaranteed/insured/protected funds, "still owed to you", rejected lines on GC/HO cards.

### 6.6 Resend / notifications

Material-added already emails/notifies HO. Status changes to `paid` may need a careful notification policy so we do not spam or make money claims Compliance has not approved. Out of scope for mechanics; flag for Compliance + Job Ops.

### 6.7 Partial data jobs

If ops only logs some lines, trackers will look "wrong" again. Admin checklist on stage: "All BMH pays for this stage logged?"

---

## 7. Cursor prompt readiness

| Item | Owner | Status |
| --- | --- | --- |
| Final UI labels | **Compliance Watch** | **Cleared 23 Oct** (see status header). `compliance-watch-request.md` is obsolete. |
| Left on this job includes shop pays | Femi | Answered: yes |
| Team pay counts toward Paid to you | Femi | Answered: only `paidBy=bmh` |
| Paid to shops on GC card | Femi | Answered: yes, v1 |
| Stage-complete remainder | Femi | Answered: no auto-create; recalc on every line change |
| You sent in source | Femi | Answered: HO receipts + `hoPaymentRef` trace |
| Rejected lines visibility | Femi | Answered: admin-only |
| Materials tab rename | Femi | Answered: no rename |
| Sample image | Job Ops | Present at `/workspace/bmh-money-tracker/gc-money-tracker-sample.jpg` |

**Cursor prompt: unblocked.** Mechanics, schema, product rules and Compliance labels are locked.

No prod changes, no deploy, no push from this brief itself.

---

## 8. Open questions for Femi / Job Ops: ANSWERED (Femi via Job Ops, 2026-10-23)

1. **Leftover / stage remainder:** do not auto-create on stage complete. Recalculate Paid to you / Left on this job automatically as material or external-labour lines are added or changed. No silent auto-complete remainder.
2. **Left on this job:** yes, shrinks when shops are paid too (artisans overspend stage budget; = money not yet moved off the job). Never call it Waiting.
3. **Paid to shops on GC card:** yes for v1.
4. **Helper paid from GC's own pocket:** must not raise Paid to you. Add `paidBy: bmh | gc` on `StageTeamMember`. Budget must be respected. (Materials payee is already `payeeKind`.)
5. **You sent in source:** HO receipts (what BMH receives from the homeowner). Ops can copy the payment ID from the HO receipt to track the matching payout to the artisan (`hoPaymentRef`).
6. **Rejected lines:** admin-only; not visible to GC or HO.
7. **Materials tab:** do not rename. Keep materials separate from external labour / subcontractors (team); files (videos, photos, invoices) stay their own concern.

---

## 9. Ticket framing (one ticket, both apps)

**Title:** GC + homeowner money trackers count real inside-stage payouts (artisan vs shop).

**Scope:**

1. Schema + admin: payeeKind, status, paidAt, hoPaymentRef on StageMaterial; payStatus/paidAmount/paidAt/paidBy/hoPaymentRef on StageTeamMember. Rejected lines admin-only. No tab rename.
2. Earnings API: Paid to you, Left on this job, Paid to shops; stop treating `spent` as GC paid.
3. GC card: keep sample layout; wire new sums; shops line + helper (v1); Compliance labels as locked.
4. HO final summary section **Your money on this job**: You sent in → Still with BuildMyHouse → Sent to your contractor → Paid to shops for materials.
5. QA on BMH-U-4160 bed stage with the table in §2.

**Out of scope for v1:** full double-entry bank ledger, automatic bank sync, Resend campaign copy, public marketing claims.

---

*End of mechanics brief.*

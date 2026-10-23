# Cursor prompt: GC + homeowner money trackers count real inside-stage payouts

Repo: `femronal/buildmyhouse` (local clone `/workspace/bmh-product/repo`). Run `git pull` first. Current base checked: `644b1f3`.

Read the product brief at `docs/design/money-tracker/brief.md` (packaged with this prompt). Layout sample: `docs/design/money-tracker/gc-money-tracker-sample.jpg` (title and prices in the sample are fake; layout only).

This is one ticket for both the GC app and the homeowner app, plus admin so the numbers can be true.

Write for Koso. Plain English. No em dashes. Short sentences. Do not invent money labels. Use only the Compliance Watch strings listed below. Do not push secrets. Do not rename the admin Materials tab.

---

## Goal

Today `Paid to you` and `Waiting` on the GC project page come from `project.spent`, which is overwritten by completed stage `estimatedCost` and sometimes incremented by Stripe. Materials and team lines on a stage do not move those numbers. Live job BMH-U-4160 (bed stage ₦130,000) already paid transport and shop invoices that the GC app never showed, so the artisan distrusted the app.

Ship payout-based money cards:

- GC project page: **Money for this job** with **Paid to you**, **Left on this job**, **Full job price**, **Paid to shops**, helper **Shop pays are separate from paid to you.**
- Homeowner: section **Your money on this job** with **You sent in**, **Still with BuildMyHouse**, **Sent to your contractor**, **Paid to shops for materials**.

Hard rejects in any GC or homeowner UI: escrow, trust account, safeguarded / guaranteed / insured / protected funds, "still owed to you", rejected lines, and the words "Waiting" or "Waiting for you" for the leftover money number.

---

## Locked product rules (Femi via Job Ops, 23 Oct)

1. No auto remainder line on stage complete. Recalculate sums whenever a material or team line is added, edited, re-statused, or removed.
2. **Left on this job** = Full job price minus all money moved off the job (artisan paid + shops paid + BMH-paid team + other paid).
3. Show **Paid to shops** on the GC card in v1.
4. Team rows get `paidBy`: `bmh` | `gc`. Helpers the GC paid from his own pocket (`paidBy=gc`) must not raise **Paid to you** and must not shrink **Left on this job**. Respect the stage budget (warn in admin when BMH-paid lines on a stage exceed `Stage.estimatedCost`).
5. **You sent in** = HO receipts / completed inbound `Payment` rows for the project. Ops can copy the payment ID onto a payout line via optional `hoPaymentRef`. If cheap, show the Payment id in admin next to HO receipts so ops can paste it.
6. Rejected lines are admin-only. Never show them to GC or homeowner (not even as cancelled).
7. Do not rename the Materials tab. Keep materials separate from team. Files (media / documents) stay separate.

---

## Compliance Watch final strings (use exactly)

### GC card (`apps/mobile-contractor/app/contractor/gc-project-detail.tsx`)

- Section title: `Money for this job`
- `Paid to you`
- `Left on this job`
- `Full job price`
- `Paid to shops`
- Helper: `Shop pays are separate from paid to you.`

### Homeowner (`Your money on this job`)

- Section title: `Your money on this job`
- `You sent in`
- `Still with BuildMyHouse`
- `Sent to your contractor`
- `Paid to shops for materials`

If HO receipts are missing so the three-way split cannot be computed honestly, show plain text `Not enough records yet` instead of inventing numbers.

---

## Schema (Prisma)

File: `apps/backend/prisma/schema.prisma`

### `StageMaterial` (today ends ~line 1295)

Add:

- `payeeKind` String  // `artisan` | `shop` | `other` (required on new create/edit; backfill existing rows as `shop` or `other` with a short admin note to review)
- `status` String @default("planned")  // `planned` | `invoiced` | `paid` | `rejected`
- `paidAt` DateTime?
- `hoPaymentRef` String?  // optional; ops pastes HO Payment id

Keep existing name, quantity, unitPrice, totalPrice, supplier, receiptUrl, notes, etc.

### `StageTeamMember` (today ends ~line 1272)

Add:

- `payStatus` String @default("planned")  // `planned` | `invoiced` | `paid` | `rejected`
- `paidAmount` Float?  // if null when paid, use dailyRate * days (same day math as getGCEarnings today)
- `paidAt` DateTime?
- `paidBy` String?  // `bmh` | `gc`; required when payStatus is paid
- `hoPaymentRef` String?

Create a Prisma migration. Do not invent a separate bank ledger table in v1.

---

## DTOs and API

- `apps/backend/src/stages/dto/create-stage-material.dto.ts` and any update DTO: accept the new fields with validation. Empty / clear of paidAt when status leaves `paid` is fine.
- `apps/backend/src/stages/dto/create-stage-team-member.dto.ts` and update DTO: same for team pay fields. Validate `paidBy` is `bmh` or `gc` when `payStatus` is `paid`.
- Admin service types: `apps/admin-dashboard/src/services/adminProjectService.ts` (`StageMaterial`, `StageTeamMember`, `CreateMaterialData`, `CreateTeamMemberData`).
- Persist through existing create/update material and team-member routes in `apps/backend/src/projects/projects.service.ts` (`addStageMaterial` ~2872 and the matching update/delete paths). Creating a material must still not change `stage.estimatedCost` by itself; only the new payout sums change.

GC and homeowner list/detail APIs that return materials or team must **filter out** `status=rejected` / `payStatus=rejected`. Admin keeps them visible.

---

## Earnings math (source of truth)

Rewrite `getGCEarnings` in `apps/backend/src/contractors/contractors.service.ts` (~line 3365).

Stop using `project.spent` as Paid to you.

Per project:

```
JOB_PRICE        = project.budget
ARTISAN_PAID     = sum(StageMaterial.totalPrice where payeeKind=artisan AND status=paid)
                 + sum(team paidAmount or dailyRate*days where payStatus=paid AND paidBy=bmh)
SHOP_PAID        = sum(StageMaterial.totalPrice where payeeKind=shop AND status=paid)
OTHER_PAID       = sum(StageMaterial.totalPrice where payeeKind=other AND status=paid)
MONEY_MOVED      = ARTISAN_PAID + SHOP_PAID + OTHER_PAID

paidToYou        = ARTISAN_PAID
paidToShops      = SHOP_PAID
leftOnThisJob    = max(0, JOB_PRICE - MONEY_MOVED)
fullJobPrice     = JOB_PRICE
```

Return clear field names on the earnings DTO (for example `paidToYou`, `leftOnThisJob`, `fullJobPrice`, `paidToShops`). Keep temporary aliases `earned` / `pending` / `budget` only if other screens still read them, but make those aliases map to the new payout math (not `project.spent`). Prefer updating call sites:

- `apps/mobile-contractor/app/contractor/gc-project-detail.tsx` (money card ~555)
- `apps/mobile-contractor/app/contractor/gc-earnings.tsx`
- `apps/mobile-contractor/app/contractor/gc-dashboard.tsx` and `gc-profile.tsx` if they sum `earned` / `pending`
- `apps/mobile-contractor/services/gcService.ts` types

**Explicit: do not double-count.** Never add a completed stage's full `estimatedCost` into Paid to you when payout lines already record the money. Stage complete must not auto-create a remainder line and must not add anything to these totals.

`syncProjectAfterStageChange` in `apps/backend/src/projects/projects.service.ts` (~1799) today sets `spent = sum(estimatedCost of completed stages)`. Do not let that overwrite become the meaning of Paid to you. Either leave `spent` alone for old screens but stop reading it for GC paid, or in this same ticket redefine a documented secondary field. Preferred: earnings DTO ignores `spent` for Paid to you / Left on this job.

Sums must recompute on every material/team add/edit/status change (no cache that only updates on stage complete). Rejected lines never enter any sum.

---

## GC project page UI

File: `apps/mobile-contractor/app/contractor/gc-project-detail.tsx`

Keep navy styling and Poppins. Labels 16px+. Match the sample order:

1. Job progress bar stays above the money card.
2. Section title: **Money for this job** (replace "Your money for this job").
3. Two big tiles: **Paid to you** | **Left on this job**.
4. Under them: **Full job price** ₦…
5. Secondary line: **Paid to shops** ₦…
6. Helper under shops: **Shop pays are separate from paid to you.**
7. Homeowner Call / Message block stays below (unchanged behaviour).

Wire numbers from the new earnings fields for this project id. Low literacy: large numbers, short words, no jargon.

Also update `gc-earnings.tsx` (and any home/dashboard tiles that still say Waiting for money) to the same labels and math so the artisan does not see two different stories.

---

## Homeowner final summary UI

There is no dedicated three-way money summary today. Closest:

- `apps/mobile-homeowner/app/dashboard.tsx` Financial Summary (~562): Total Budget / Spent / Remaining (Spent = completed stages' estimatedCost, fallback `project.spent`).
- `apps/mobile-homeowner/app/(tabs)/finance.tsx` (~277): Spent / Remaining from `project.spent`.

**Do this:** replace or extend the Financial Summary on `dashboard.tsx` with a clear section titled **Your money on this job** and the four Compliance rows. Align the project money block on `finance.tsx` to the same fields so the homeowner does not see conflicting Spent numbers for the same job. Prefer a small shared API payload (for example on project get or a thin `/projects/:id/money-summary`) computed server-side with:

```
youSentIn              = sum(completed inbound Payment.amount for project)  // HO receipts
sentToContractor       = ARTISAN_PAID
paidToShopsForMaterials = SHOP_PAID
stillWithBuildMyHouse  = max(0, youSentIn - sentToContractor - paidToShopsForMaterials - OTHER_PAID)
```

If there are no completed inbound payments / receipts, show **Not enough records yet** instead of fake zeros that imply BMH holds nothing.

Do not show rejected lines. Do not use escrow language.

---

## Admin (required for truth)

File: `apps/admin-dashboard/src/components/AdminStageEditor.tsx`

- **Materials tab** (keep the name Materials): edit `payeeKind`, `status`, `paidAt` (set when status becomes paid; clear if reverted), optional `hoPaymentRef`, keep receipt/supplier.
- **Team tab**: edit `payStatus`, `paidAmount`, `paidAt`, `paidBy` (`bmh` | `gc`), optional `hoPaymentRef`.
- Rejected rows stay visible in admin only.
- Warn (non-blocking toast or banner is fine) when sum of BMH-paid material+team lines on a stage exceeds `stage.estimatedCost`.
- If cheap: on the project payments / receipts UI, show each completed Payment id so ops can copy it into `hoPaymentRef`.

Update `adminProjectService.ts` types and payloads to match.

---

## QA with BMH-U-4160 bed stage

Use this table (ops examples) after admin can mark lines:

| Line | payeeKind | Amount | status | Counts toward Paid to you? |
| --- | --- | --- | --- | --- |
| Transport / mobilisation | artisan | 15000 | paid | Yes |
| Foam (Olaneye Mushin) | shop | 30000 | paid | No (Paid to shops) |
| Fabric (Emarson Ladipo) | shop | 19800 | invoiced | No until paid |
| Hardware (Shatayo Ladipo) | shop | 11600 | invoiced | No until paid |
| Cutting fee | artisan | 2500 | planned or invoiced until paid | Yes when paid |
| Mrs M. Alabi wood | (rejected) | 47000 | rejected | Never |

Bed stage price ₦130,000. After marking transport + foam paid only:

- Paid to you = 15000
- Paid to shops = 30000
- Left on this job = 130000 - 15000 - 30000 - (any other paid) = 85000 if job price is still 130000 and no other paid lines
- Full job price = project.budget (confirm on the live project; do not hardcode)

Also confirm: marking a stage completed does **not** jump Paid to you by the full stage estimatedCost.

Add a team row with `paidBy=gc` and `payStatus=paid` and confirm Paid to you and Left on this job do not change. Add one with `paidBy=bmh` and confirm Paid to you rises and Left on this job shrinks.

---

## Out of scope for this ticket

- Full double-entry bank ledger or automatic bank sync
- Renaming Materials tab
- Resend / notification copy for paid status
- Public marketing claims
- Changing bottom tabs or unrelated GC home redesign work

---

## Test steps (must pass before deploy)

1. `git pull` on `femronal/buildmyhouse`. Apply migration. Admin can open a stage Materials tab and set payeeKind + status + paidAt; Team tab can set payStatus, paidAmount, paidAt, paidBy.
2. On a test project with budget 130000, add transport 15000 artisan paid and foam 30000 shop paid. GC project page shows Money for this job: Paid to you ₦15,000; Paid to shops ₦30,000; Left on this job ₦85,000; Full job price ₦130,000; helper text present. No "Waiting" label on that leftover number.
3. Mark bed stage completed without adding a remainder line. Paid to you stays ₦15,000 (does not become ₦130,000 or ₦145,000).
4. Add team helper paidBy=gc paid 5000. Paid to you and Left on this job unchanged. Change paidBy to bmh. Paid to you becomes ₦20,000; Left on this job becomes ₦80,000.
5. Set a material to rejected. It disappears from GC and homeowner views but remains in admin. Sums ignore it.
6. Homeowner dashboard (and finance project block) shows Your money on this job with You sent in / Still with BuildMyHouse / Sent to your contractor / Paid to shops for materials matching the formulas. With no HO receipts, shows Not enough records yet.
7. GC earnings screen and any dashboard money tiles use the same payout math and labels (no spent-as-earned).
8. Grep GC and homeowner money UI for escrow, trust account, safeguarded, guaranteed, insured, protected funds, "still owed to you", and money-tile "Waiting" / "Waiting for you". None present on the money cards.

When the change is done and the test steps pass, deploy it straight away. No PR or PR notes are needed.

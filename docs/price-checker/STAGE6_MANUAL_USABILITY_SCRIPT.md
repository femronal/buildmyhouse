# Stage 6 — Manual usability script

**Status:** Required before Stage 6 can be marked CLOSED.  
Automated tests do **not** satisfy the “five non-technical testers” exit criterion.

## Goal

Confirm that five non-technical users can complete a price check without help and correctly explain what the confidence label means.

## Setup

- Staging or production URL: `/tools/price-checker`
- Device mix: at least three phones (Android preferred), two desktop/laptop
- Testers: friends/family who are not engineers
- Observer notes only — do not coach unless they are fully stuck for >2 minutes

## Task script (read aloud)

1. Open the Price Checker.
2. Find a product you might buy for a building project (suggest: cement, or let them choose).
3. Answer every question the tool asks.
4. Use **I don’t know** for at least one question.
5. After you finish answering, go back and **change one earlier answer** (for example the location or brand).
6. Generate the price report.
7. Open the report in a new tab.
8. In your own words, tell the observer what the confidence label means.

Optional if time allows:

9. Download the PDF.
10. Start another price check.

## What to record per tester

| Field | Notes |
|---|---|
| Tester ID | T1–T5 |
| Device | e.g. Tecno Android Chrome |
| Completed without help? | Yes / No |
| Hesitation points | Where they paused or re-read |
| Confusing terms | Exact words that confused them |
| Understood observed range ≠ guaranteed market price? | Yes / Partial / No |
| Noticed Pause & Edit? | Yes / No |
| Explained confidence correctly? | Yes / Partial / No |
| Time to completion | minutes |
| Free comments | |

### Acceptable explanation of confidence (examples)

- “How sure the tool is, based on how many good sources matched.”
- “High means several recent sellers agreed; low means evidence was thin.”

Not acceptable:

- “It means this is the cheapest price.”
- “It means the price is guaranteed.”
- “I don’t know what it means.”

## Pass rule for the manual criterion

At least **4 of 5** testers:

1. Complete the flow without help, and  
2. Give an acceptable confidence explanation.

Record results below when testing is done. Leave the roadmap checkbox open until then.

## Results log

| Tester | Device | No help | Confidence OK | Time | Notes |
|---|---|---|---|---|---|
| T1 | | | | | |
| T2 | | | | | |
| T3 | | | | | |
| T4 | | | | | |
| T5 | | | | | |

**Manual criterion status:** OPEN — awaiting five real testers.

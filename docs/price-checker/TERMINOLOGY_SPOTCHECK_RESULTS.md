# Price Checker — GPT-5.6 Terminology Spot-Check Results

**Run date:** 2026-07-28 (completed 2026-07-29 02:14 UTC) · **Model:** `gpt-5.6-sol` (via `PRICE_CHECKER_MATRIX_MODEL`)
**Runner:** `apps/backend/scripts/price-checker-terminology-check.ts --all` · **Raw records:** `apps/backend/scripts/data/terminology-check-results.json` (includes model response IDs, per-record source references, dates, confidence)
**Corpus:** `apps/backend/scripts/data/terminology-samples.json` — 51 real Nigerian seller listing texts (2–3 per family) captured manually from public Jiji.ng search pages on 2026-07-28. No restricted scraping, CAPTCHA bypassing or account access. Listing prices were excluded and are not market data.

## Outcome

- **52 checks run · 52 valid structured outputs · 0 failures** (strict JSON schema, one retry allowed — none needed a second retry to fail).
- All 25 Level 1 families checked. Token usage: 33,958 prompt + 57,496 completion (logged per run; comfortably inside the non-revenue budget).
- An AI spot check is **not** professional certification, and none was recorded as one (`adminCorrectionApplied` tracked per record).

## Material corrections applied (2026-07-28, versioned in family data comments)

Alias/market-name gaps were the dominant finding (matching-critical). Applied to `families/*.data.ts`:

| Family | Added terms (from real listings) |
|---|---|
| cement | lafarge, lafarg, lafage (misspellings), 3x cement |
| reinforcement-steel | tmt, tmt rod, tmt iron rod, tmt rebar |
| concrete-blocks | 4 inch block, stone dust block |
| sand | laterite sand |
| granite-aggregates | stone dust |
| roofing | shingle, 0.55 gauge, stone coated roofing tiles |
| waterproofing | bitumen felt, roofing felt, app membrane, sbs membrane, bitumen emulsion |
| doors | turkey door, turkey security door, entrance door, front door, exit door |
| aluminium-windows | ghana window, ghana sliding window, projected window, swing window, frameless window, window with net |
| tiles | compound tiles, super polish tiles |
| paint | matt emulsion, silk paint, satin emulsion, hybrid emulsion, drum of paint |
| pop-ceilings | pop cement, gypsum pop cement, white pop cement, plaster board, ceiling pop |
| external-paving | interlock stone, interlock, pavers |
| kitchen-cabinets | hdf kitchen cabinet, hdf cabinet, ready-made kitchen cabinet, portable kitchen cabinet, marble top kitchen cabinet |
| sanitary-wares | wc set, water closet set, complete set wc, wash hand basin, 2 piece wc, twyford |
| electrical-cables | single cable, single core cable, 1core, 3c cable, flexible cable, full roll, factory coil |
| electrical-protection | change over switch, changeover switch, transfer switch, ats, knife switch, fuse unit |
| plumbing-pipes | ips pipe, sanica, hot and cold pipe, ppr connectors |
| water-pumps | italian pump, stainless pump, self priming pump, flat head pump, sewage pump |
| water-tanks | gp tank, gee pee tank, rubber tank, storex |
| solar-panels | half cut panel, halfcut, bifacial panel, 144 cells, 550w panel |
| inverters | all in one inverter, battery independent inverter, transformer based inverter |
| batteries | tall tubular battery |
| generators | soundproof generator, semi silent generator, silent canopy, perkins, senci, kipor |
| cctv-security | turbo hd, ahd, camera kit, complete camera kit, cctv kit, channel dvr |

## Attribute/question proposals — deliberately NOT hard-coded

The model also proposed attribute and clarification-question additions (e.g. warranty period, country of origin, colour/finish, cable coil length, DVR storage capacity). Under the founder's dynamic-matrix policy these are **not** baked into the static templates: the runtime matrix is AI-generated per request and already surfaces such attributes dynamically (`DYNAMIC_MATRIX_POLICY.md`). The proposals remain in the raw results JSON as admin-reviewable input for future template revisions.

## Structural findings worth remembering

1. **Search pollution is real:** block searches return block-*machine* ads; POP and paving searches return installation-*service* ads; inverter searches return full-system *bundles*. This validates the `productType`/bundle hard-blocks in the matrices and the matrix's mismatch-detection duty.
2. **Sellers mislabel units** ("900m by 2100m" doors); the doors matrix retains a confirmation question pattern for dimensions.
3. **Warranty and origin claims** ("50 years warranty", "100% India battery", "Made in Italy") are pervasive marketing language — captured as evidence text, never as verified specs.

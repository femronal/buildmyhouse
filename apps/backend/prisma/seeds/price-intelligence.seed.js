var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// prisma/seeds/price-intelligence.seed.ts
var price_intelligence_seed_exports = {};
__export(price_intelligence_seed_exports, {
  PRICE_TAXONOMY_SEED_VERSION: () => PRICE_TAXONOMY_SEED_VERSION,
  seedPriceIntelligence: () => seedPriceIntelligence
});
module.exports = __toCommonJS(price_intelligence_seed_exports);
var import_client = require("@prisma/client");

// src/price-intelligence/taxonomy/units.ts
var UNITS = [
  // count / package
  { code: "piece", label: "Per piece", aliases: ["each", "unit", "pc", "one"], dimension: "count" },
  { code: "set", label: "Per set", aliases: ["complete set", "full set"], dimension: "package" },
  { code: "pair", label: "Per pair", aliases: [], dimension: "package" },
  { code: "bag_50kg", label: "Per 50 kg bag", aliases: ["bag", "per bag"], dimension: "package" },
  { code: "bag_40kg", label: "Per 40 kg bag", aliases: [], dimension: "package" },
  { code: "carton", label: "Per carton", aliases: ["ctn", "box"], dimension: "package" },
  { code: "bundle", label: "Per bundle", aliases: [], dimension: "package" },
  { code: "pallet", label: "Per pallet", aliases: [], dimension: "package" },
  { code: "roll", label: "Per roll", aliases: [], dimension: "package" },
  { code: "coil", label: "Per coil", aliases: ["per roll of cable"], dimension: "package" },
  { code: "drum", label: "Per drum", aliases: ["keg"], dimension: "package" },
  { code: "bucket_20l", label: "Per 20 L bucket", aliases: ["bucket", "20 litres"], dimension: "package" },
  { code: "gallon_4l", label: "Per 4 L gallon", aliases: ["gallon"], dimension: "package" },
  { code: "truckload", label: "Per truckload", aliases: ["trip", "per trip", "tipper"], dimension: "package" },
  { code: "trailer_600bags", label: "Per 600-bag trailer", aliases: ["trailer load"], dimension: "package" },
  // length / area / volume
  { code: "length_12m", label: "Per 12 m length", aliases: ["per length", "full length"], dimension: "length" },
  { code: "length_5_8m", label: "Per 5.8 m length", aliases: [], dimension: "length" },
  { code: "metre", label: "Per metre", aliases: ["m", "per meter"], dimension: "length" },
  { code: "sqm", label: "Per square metre", aliases: ["m2", "sq m", "per square meter"], dimension: "area" },
  { code: "cubic_metre", label: "Per cubic metre", aliases: ["m3"], dimension: "volume" },
  { code: "litre", label: "Per litre", aliases: ["l", "ltr"], dimension: "volume" },
  // mass
  { code: "kg", label: "Per kilogram", aliases: ["kilo"], dimension: "mass" },
  { code: "tonne", label: "Per tonne", aliases: ["ton", "tons"], dimension: "mass" },
  // electrical
  { code: "watt", label: "Per watt", aliases: ["w"], dimension: "power" },
  { code: "kva", label: "Per kVA", aliases: [], dimension: "power" },
  { code: "kwh", label: "Per kWh", aliases: [], dimension: "energy" },
  { code: "ah", label: "Per amp-hour", aliases: [], dimension: "electric_capacity" },
  // service units
  { code: "point", label: "Per installation point", aliases: ["per point"], dimension: "service" },
  { code: "room", label: "Per room", aliases: [], dimension: "service" },
  { code: "job", label: "Per job", aliases: ["per project", "lump sum"], dimension: "service" },
  { code: "day", label: "Per day", aliases: ["daily"], dimension: "service" },
  { code: "linear_metre", label: "Per linear metre", aliases: ["running metre"], dimension: "length" }
];
var UNIT_INDEX = new Map(UNITS.map((u) => [u.code, u]));
var CONVERSION_RULES = [
  {
    fromUnit: "tonne",
    toUnit: "kg",
    factorSource: "fixed",
    fixedFactor: 1e3,
    requiredInput: "None \u2014 physical constant."
  },
  {
    fromUnit: "bucket_20l",
    toUnit: "litre",
    factorSource: "fixed",
    fixedFactor: 20,
    requiredInput: "None \u2014 bucket size is part of the canonical unit."
  },
  {
    fromUnit: "gallon_4l",
    toUnit: "litre",
    factorSource: "fixed",
    fixedFactor: 4,
    requiredInput: "None \u2014 gallon size is part of the canonical unit."
  },
  {
    fromUnit: "trailer_600bags",
    toUnit: "bag_50kg",
    factorSource: "fixed",
    fixedFactor: 600,
    requiredInput: "None \u2014 trailer size is part of the canonical unit."
  },
  {
    fromUnit: "carton",
    toUnit: "sqm",
    factorSource: "product_spec",
    requiredInput: "Square metres per carton for the EXACT tile product (from carton label or product spec).",
    note: "Prohibited when m\xB2 per carton is unknown. Never assume a generic coverage."
  },
  {
    fromUnit: "carton",
    toUnit: "piece",
    factorSource: "product_spec",
    requiredInput: "Pieces per carton for the exact product."
  },
  {
    fromUnit: "coil",
    toUnit: "metre",
    factorSource: "seller_stated",
    requiredInput: "Coil length in metres as stated by the seller or printed on the drum."
  },
  {
    fromUnit: "length_12m",
    toUnit: "tonne",
    factorSource: "manufacturer_spec",
    requiredInput: "Kilograms per 12 m length for the exact rebar diameter (standard mass tables).",
    note: "Diameter must be known; conversion prohibited if diameter unknown."
  },
  {
    fromUnit: "piece",
    toUnit: "watt",
    factorSource: "manufacturer_spec",
    requiredInput: "Rated wattage of the exact solar panel model.",
    note: "Produces price-per-watt for solar panels only."
  },
  {
    fromUnit: "truckload",
    toUnit: "tonne",
    factorSource: "seller_stated",
    requiredInput: 'Load tonnage as stated by the seller (e.g. "20 tons of sharp sand").',
    note: 'A "tipper" has no standard size; the seller statement is mandatory.'
  },
  {
    fromUnit: "roll",
    toUnit: "sqm",
    factorSource: "product_spec",
    requiredInput: "Roll dimensions (width \xD7 length) for the exact membrane product."
  }
];

// src/price-intelligence/taxonomy/locations.ts
var LOCATIONS = [
  { key: "ng", label: "Nigeria", type: "country" },
  // Launch states
  { key: "ng-lagos", label: "Lagos", type: "state", parentKey: "ng", launchPriority: true },
  { key: "ng-ogun", label: "Ogun", type: "state", parentKey: "ng", launchPriority: true },
  { key: "ng-fct", label: "Abuja (FCT)", type: "state", parentKey: "ng", launchPriority: true },
  { key: "ng-edo", label: "Edo", type: "state", parentKey: "ng", launchPriority: true },
  // Other states (expandable to all 36 + FCT; add rows, not code)
  { key: "ng-oyo", label: "Oyo", type: "state", parentKey: "ng" },
  { key: "ng-rivers", label: "Rivers", type: "state", parentKey: "ng" },
  { key: "ng-anambra", label: "Anambra", type: "state", parentKey: "ng" },
  { key: "ng-enugu", label: "Enugu", type: "state", parentKey: "ng" },
  { key: "ng-kano", label: "Kano", type: "state", parentKey: "ng" },
  { key: "ng-kaduna", label: "Kaduna", type: "state", parentKey: "ng" },
  { key: "ng-delta", label: "Delta", type: "state", parentKey: "ng" },
  { key: "ng-ondo", label: "Ondo", type: "state", parentKey: "ng" },
  { key: "ng-osun", label: "Osun", type: "state", parentKey: "ng" },
  { key: "ng-ekiti", label: "Ekiti", type: "state", parentKey: "ng" },
  // Lagos cities / areas / markets
  { key: "ng-lagos-mainland", label: "Lagos Mainland", type: "city", parentKey: "ng-lagos" },
  { key: "ng-lagos-island", label: "Lagos Island / Lekki axis", type: "city", parentKey: "ng-lagos" },
  { key: "ng-lagos-ikeja", label: "Ikeja", type: "local_area", parentKey: "ng-lagos-mainland" },
  { key: "ng-lagos-yaba", label: "Yaba", type: "local_area", parentKey: "ng-lagos-mainland" },
  { key: "ng-lagos-ajah", label: "Ajah", type: "local_area", parentKey: "ng-lagos-island" },
  { key: "mkt-orile-coker", label: "Orile/Coker building materials market", type: "market", parentKey: "ng-lagos-mainland" },
  { key: "mkt-mile12-owode", label: "Owode Onirin iron market", type: "market", parentKey: "ng-lagos-mainland" },
  { key: "mkt-dosunmu-idumota", label: "Idumota/Dosunmu electrical market", type: "market", parentKey: "ng-lagos-island" },
  // Ogun cities / markets
  { key: "ng-ogun-abeokuta", label: "Abeokuta", type: "city", parentKey: "ng-ogun" },
  { key: "ng-ogun-mowe-ibafo", label: "Mowe / Ibafo axis", type: "city", parentKey: "ng-ogun" },
  { key: "ng-ogun-sango-otta", label: "Sango Otta", type: "city", parentKey: "ng-ogun" },
  // FCT
  { key: "ng-fct-abuja", label: "Abuja city", type: "city", parentKey: "ng-fct" },
  { key: "mkt-deidei", label: "Dei-Dei building materials market", type: "market", parentKey: "ng-fct-abuja" },
  // Edo
  { key: "ng-edo-benin", label: "Benin City", type: "city", parentKey: "ng-edo" }
];
var LOCATION_INDEX = new Map(LOCATIONS.map((l) => [l.key, l]));

// src/price-intelligence/taxonomy/evidence.ts
var SOURCE_ACCESS_REGISTER = [
  { sourceName: "Manufacturer / distributor sites (Dangote, BUA, Lafarge, cable makers\u2026)", accessStatus: "public_manual_research_only", note: "Price lists are rarely public; distributor confirmation preferred." },
  { sourceName: "Jumia Nigeria", accessStatus: "public_structured_data", note: "Product pages carry structured data; respect robots and rate limits. Re-verify ToS in Stage 4." },
  { sourceName: "Jiji.ng", accessStatus: "public_manual_research_only", note: "Classified listings (Tier 3). Treat prices as negotiable asking prices. Automated extraction to be assessed against ToS in Stage 4." },
  { sourceName: "Konga", accessStatus: "automated_extraction_prohibited", note: "Access-restricted platform per Stage 2 instruction; manual research only unless partnership." },
  { sourceName: "Facebook Marketplace / social pages", accessStatus: "automated_extraction_prohibited", note: "Login-gated; no automation. Manual, permission-based only." },
  { sourceName: "Merchant WhatsApp price lists", accessStatus: "permission_required", note: "Preferred channel: consented weekly submissions via admin entry." },
  { sourceName: "Google Business profiles", accessStatus: "public_manual_research_only", note: "Use for merchant identity/location verification, not automated price harvest." }
];

// src/price-intelligence/taxonomy/families/common.ts
function q(id, prompt, type, requirement, extra = {}) {
  return {
    id,
    prompt,
    type,
    requirement,
    options: extra.options,
    dependsOn: extra.dependsOn,
    whyItMatters: extra.whyItMatters,
    allowUnknown: extra.allowUnknown ?? true
  };
}
var COMMON_QUESTIONS = [
  q("quantity", "How much do you need?", "quantity_unit", "always", {
    whyItMatters: "Bulk quantities often unlock wholesale pricing.",
    allowUnknown: false
  }),
  q("delivery_needed", "Do you need it delivered to your site?", "yes_no", "always", {
    whyItMatters: "Most listed prices exclude delivery; transport can change the total significantly.",
    allowUnknown: false
  })
];
var ALL_INCLUSION_CHECKS = [
  "delivery",
  "vat",
  "installation",
  "accessories",
  "warranty",
  "labour",
  "transportation",
  "loading_offloading",
  "minimum_quantity",
  "negotiable"
];
var COMMODITY_RISK_FLAGS = [
  "deposit_only",
  "contact_for_price",
  "placeholder_price",
  "smaller_spec",
  "wholesale_only"
];
var EQUIPMENT_RISK_FLAGS = [
  "used_item",
  "accessory_only",
  "deposit_only",
  "contact_for_price",
  "placeholder_price",
  "smaller_spec",
  "damaged_stock",
  "discontinued",
  "rental_not_sale",
  "incomplete_bundle"
];
function sample(description, priceNgn, unit, sourceType, note) {
  return {
    description,
    priceNgn,
    unit,
    sourceType,
    note: `ILLUSTRATIVE ONLY \u2014 not current market data, never user-facing. ${note}`,
    illustrativeOnly: true
  };
}

// src/price-intelligence/taxonomy/families/energy-security.data.ts
var SOLAR_PANELS = {
  key: "solar-panels",
  name: "Solar panels",
  // Spot-check additions 2026-07-28: half-cut/144-cell/bifacial descriptors ("front and back charger"), 550W the common size
  marketNames: ["solar panel", "solar", "mono panel", "jinko", "canadian solar", "400w panel", "pv panel", "half cut panel", "halfcut", "bifacial panel", "144 cells", "550w panel"],
  parentCategory: "energy",
  kind: "product",
  applicableConditions: ["new", "used"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "mono", label: "Monocrystalline panels" },
    { key: "poly", label: "Polycrystalline panels" },
    { key: "mounting", label: "Mounting rails & accessories" }
  ],
  attributes: [
    { key: "panel_type", label: "Panel type", priceChanging: true, values: ["mono", "poly", "mono_half_cut"] },
    { key: "wattage", label: "Rated wattage", priceChanging: true, values: ["200", "300", "400", "450", "550", "600"] },
    { key: "brand", label: "Brand", priceChanging: true, values: ["Jinko", "Canadian Solar", "LONGi", "JA Solar", "Generic"] },
    { key: "condition", label: "New or used", priceChanging: true, values: ["new", "used"] },
    { key: "warranty_years", label: "Warranty", priceChanging: true }
  ],
  sellerUnits: ["piece", "watt"],
  normalizedUnit: "watt",
  normalizedUnitRationale: "Price-per-watt is the honest comparator across different panel sizes; the conversion divides panel price by manufacturer-rated wattage (always known for the exact model). Per-panel price is preserved.",
  questions: [
    q("wattage", "What panel wattage? (Or tell us the total kW you want and we\u2019ll note panel count.)", "single_select", "always", { options: ["200W", "300W", "400W", "450W", "550W", "600W", "Not sure"], allowUnknown: true }),
    q("panel_type", "Mono or poly panels?", "single_select", "optional", { options: ["Mono", "Poly", "Not sure"], whyItMatters: "Mono panels yield more per m\xB2 and dominate current supply." }),
    q("brand", "Brand preference?", "brand_search", "optional", { whyItMatters: "Tier-1 brands carry real 25-year warranties; generic panels often do not." }),
    q("condition", "New or fairly used?", "single_select", "always", { options: ["New", "Fairly used"], allowUnknown: false }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["panel_type", "wattage", "brand", "condition"],
    closeMatchKeys: ["panel_type", "wattage", "condition"],
    neverComparableAcross: ["condition"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "electrical_engineer", reason: "PV ratings, authenticity and system matching are electrical domain." },
  samples: [
    sample("550 W mono half-cut, tier-1 brand, new, per panel", 185e3, "piece", "established_ecommerce", "Tests piece\u2192watt manufacturer-spec conversion."),
    sample("400 W mono, used (ex-UK), per panel", 65e3, "piece", "classified_listing", "Tests used-condition gating.")
  ]
};
var INVERTERS = {
  key: "inverters",
  name: "Inverters",
  // Spot-check additions 2026-07-28: all-in-one systems, battery-independent, transformer-based descriptors; many ads are full bundles (inverter+battery+panels)
  marketNames: ["inverter", "hybrid inverter", "growatt", "felicity", "5kva inverter", "power inverter", "all in one inverter", "battery independent inverter", "transformer based inverter"],
  parentCategory: "energy",
  kind: "product",
  applicableConditions: ["new", "used"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "hybrid", label: "Hybrid (solar-ready) inverters" },
    { key: "standalone", label: "Standalone battery inverters" },
    { key: "system-bundle", label: "Complete inverter system bundles" }
  ],
  attributes: [
    { key: "capacity_kva", label: "Rated capacity (kVA)", priceChanging: true, values: ["1.5", "2.5", "3.5", "5", "7.5", "10"] },
    { key: "inverter_type", label: "Hybrid or standalone", priceChanging: true, values: ["hybrid", "standalone"] },
    { key: "waveform", label: "Waveform", priceChanging: true, values: ["pure_sine", "modified_sine"] },
    { key: "battery_voltage", label: "Battery voltage", priceChanging: true, values: ["12", "24", "48"] },
    { key: "mppt_included", label: "MPPT charge controller built in", priceChanging: true },
    { key: "brand", label: "Brand", priceChanging: true, values: ["Growatt", "Felicity", "Luminous", "Prag", "Other"] },
    { key: "bundle_state", label: "Unit only or system bundle", priceChanging: true, values: ["unit_only", "with_batteries", "full_system"] }
  ],
  sellerUnits: ["piece", "set"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Inverter-only prices compare per unit at matched kVA/voltage; bundles (with batteries/panels) are a separate bundle_state and never compare with bare units.",
  questions: [
    q("capacity_kva", "What inverter capacity (kVA)? Tell us what you want to power if unsure.", "single_select", "always", { options: ["1.5", "2.5", "3.5", "5", "7.5", "10", "Not sure"], allowUnknown: true }),
    q("inverter_type", "Hybrid (works with solar) or standalone?", "single_select", "always", { options: ["Hybrid", "Standalone", "Not sure"], allowUnknown: true }),
    q("battery_voltage", "System battery voltage (12/24/48V)?", "single_select", "optional", { options: ["12V", "24V", "48V", "Not sure"], whyItMatters: "48V systems are standard above 3.5 kVA; voltage must match your batteries." }),
    q("bundle_state", "Inverter only, or complete system with batteries (and panels)?", "single_select", "always", { options: ["Inverter only", "Inverter + batteries", "Full solar system"], allowUnknown: false }),
    q("installation_needed", "Include installation?", "yes_no", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["capacity_kva", "inverter_type", "waveform", "battery_voltage", "brand", "bundle_state"],
    closeMatchKeys: ["capacity_kva", "inverter_type", "bundle_state"],
    neverComparableAcross: ["bundle_state", "capacity_kva"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "electrical_engineer", reason: "Capacity, waveform and battery matching are electrical-safety domain." },
  samples: [
    sample("Growatt 5 kVA 48V hybrid, unit only, new", 85e4, "piece", "established_ecommerce", "Tests bundle_state=unit_only matching."),
    sample("3.5 kVA + 2\xD7220Ah tubular bundle, installed Lagos", 145e4, "set", "supplier_quotation", "Tests bundle separation from bare units.")
  ]
};
var BATTERIES = {
  key: "batteries",
  name: "Solar & inverter batteries",
  // Spot-check addition 2026-07-28: "tall tubular" is the standard form descriptor (Luminous Inverlast, Nexus, Glow Energy, Indian-made claims)
  marketNames: ["battery", "tubular battery", "lithium battery", "inverter battery", "220ah battery", "lifepo4", "tall tubular battery"],
  parentCategory: "energy",
  kind: "product",
  applicableConditions: ["new", "used"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "lithium", label: "Lithium (LiFePO4) batteries" },
    { key: "tubular", label: "Tubular (tall) lead-acid batteries" },
    { key: "gel-agm", label: "Gel/AGM sealed batteries" }
  ],
  attributes: [
    { key: "chemistry", label: "Battery chemistry", priceChanging: true, values: ["lithium_lifepo4", "tubular_lead_acid", "gel_agm"] },
    { key: "voltage", label: "Voltage", priceChanging: true, values: ["12", "24", "48/51.2"] },
    { key: "capacity_ah", label: "Capacity (Ah)", priceChanging: true, values: ["100", "150", "200", "220", "280"] },
    { key: "brand", label: "Brand", priceChanging: true },
    { key: "condition", label: "New or used", priceChanging: true, values: ["new", "used"] },
    { key: "warranty_months", label: "Warranty", priceChanging: true },
    { key: "bundle_state", label: "Battery only or system bundle", priceChanging: true, values: ["battery_only", "bundle"] }
  ],
  sellerUnits: ["piece", "kwh"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Chemistries are economically different products (lifespan, usable depth): comparison across chemistry is PROHIBITED, so per-piece at matched chemistry/voltage/Ah is the honest unit. kWh figures are stored when stated for lithium.",
  questions: [
    q("chemistry", "Lithium or tubular battery?", "single_select", "always", { options: ["Lithium (LiFePO4)", "Tubular (lead-acid)", "Gel/AGM", "Not sure"], whyItMatters: "Lithium costs more upfront but lasts several times longer \u2014 they are not directly comparable.", allowUnknown: true }),
    q("voltage", "What voltage?", "single_select", "always", { options: ["12V", "24V", "48V/51.2V", "Not sure"], allowUnknown: true }),
    q("capacity_ah", "What capacity (Ah)?", "single_select", "always", { options: ["100Ah", "150Ah", "200Ah", "220Ah", "280Ah", "Not sure"], allowUnknown: true }),
    q("condition", "New or used?", "single_select", "always", { options: ["New", "Used"], allowUnknown: false }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["chemistry", "voltage", "capacity_ah", "brand", "condition", "bundle_state"],
    closeMatchKeys: ["chemistry", "voltage", "capacity_ah", "condition"],
    neverComparableAcross: ["chemistry", "voltage", "condition", "bundle_state"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "electrical_engineer", reason: "Chemistry suitability, cycle-life claims and voltage matching are electrical domain." },
  samples: [
    sample("51.2V 100Ah LiFePO4 (5.12 kWh stated), new, 5-yr warranty", 115e4, "piece", "established_ecommerce", "Tests lithium spec matching + kWh capture."),
    sample("220Ah/12V tubular battery, new, per piece", 285e3, "piece", "merchant_confirmed", "Tests chemistry-gated comparison (must never pair with lithium).")
  ]
};
var GENERATORS = {
  key: "generators",
  name: "Generators",
  // Spot-check additions 2026-07-28: soundproof/semi-silent/silent-canopy descriptors, key start, copper-coil claims; brands Perkins, Senci, Kipor
  marketNames: ["generator", "gen", "silent generator", "diesel generator", "firman", "elepaq", "belgium generator", "10kva gen", "soundproof generator", "semi silent generator", "silent canopy", "perkins", "senci", "kipor"],
  parentCategory: "energy",
  kind: "product",
  applicableConditions: ["new", "used", "refurbished"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "petrol-small", label: "Small petrol generators (\u226410 kVA)" },
    { key: "diesel-silent", label: "Silent diesel generators" },
    { key: "gas", label: "Gas/dual-fuel generators" },
    { key: "industrial", label: "Industrial diesel sets (Mikano/Perkins class)" }
  ],
  attributes: [
    { key: "rated_kva", label: "Rated output (kVA)", priceChanging: true },
    { key: "fuel", label: "Fuel", priceChanging: true, values: ["petrol", "diesel", "gas", "dual"] },
    { key: "enclosure", label: "Silent or open frame", priceChanging: true, values: ["silent", "open"] },
    { key: "brand", label: "Brand", priceChanging: true, values: ["Firman/Sumec", "Elepaq", "Lutian", "Perkins", "Mikano", "Other"] },
    { key: "condition", label: "Condition", priceChanging: true, values: ["new", "used_belgium", "refurbished"] },
    { key: "changeover_included", label: "Installation/changeover included", priceChanging: true }
  ],
  sellerUnits: ["piece"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Generators trade per unit at matched kVA/fuel/enclosure; \u201CBelgium\u201D (imported used) units are a distinct condition class and never compare with new.",
  questions: [
    q("rated_kva", "What generator size (kVA)? Tell us what you want to power if unsure.", "free_text", "always", { allowUnknown: true }),
    q("fuel", "Petrol, diesel or gas?", "single_select", "always", { options: ["Petrol", "Diesel", "Gas/dual-fuel", "Not sure"], allowUnknown: true }),
    q("enclosure", "Silent (soundproof) or open frame?", "single_select", "always", { options: ["Silent", "Open frame", "Not sure"], allowUnknown: true }),
    q("condition", "New, or fairly-used \u201CBelgium\u201D?", "single_select", "always", { options: ["New", "Fairly-used (Belgium)", "Refurbished"], allowUnknown: false }),
    q("changeover_needed", "Include delivery + changeover installation?", "yes_no", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["rated_kva", "fuel", "enclosure", "brand", "condition"],
    closeMatchKeys: ["rated_kva", "fuel", "enclosure", "condition"],
    neverComparableAcross: ["fuel", "condition"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "electrical_engineer", secondary: "building_services", reason: "Load sizing and changeover wiring are electrical; fuel/mechanical service is services domain." },
  samples: [
    sample("10 kVA silent diesel, new, mid brand, Lagos", 48e5, "piece", "established_ecommerce", "Tests kVA+fuel+enclosure matching."),
    sample("6.5 kVA petrol, fairly-used Belgium, Jiji", 48e4, "piece", "classified_listing", "Tests condition-class separation and Tier 3 caution.")
  ]
};
var CCTV_SECURITY = {
  key: "cctv-security",
  name: "CCTV & security equipment",
  // Spot-check additions 2026-07-28: Turbo HD/AHD tech names, channel-count phrasing, "complete kit" composition (DVR+cameras+cable+power+storage)
  marketNames: ["cctv", "camera", "security camera", "hikvision", "dahua", "4 camera kit", "nvr", "dvr", "turbo hd", "ahd", "camera kit", "complete camera kit", "cctv kit", "channel dvr"],
  parentCategory: "security",
  kind: "system",
  applicableConditions: ["new"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "analogue-kit", label: "Analogue (HD-CVI/TVI) camera kits" },
    { key: "ip-kit", label: "IP/PoE camera kits" },
    { key: "single-camera", label: "Individual cameras" },
    { key: "recorder-storage", label: "DVR/NVR & storage" },
    { key: "accessories", label: "Cable, power supplies, monitors" }
  ],
  attributes: [
    { key: "system_type", label: "Analogue or IP", priceChanging: true, values: ["analogue", "ip_poe"] },
    { key: "camera_count", label: "Number of cameras", priceChanging: true, values: ["4", "8", "16"] },
    { key: "resolution_mp", label: "Resolution", priceChanging: true, values: ["2MP", "4MP", "8MP"] },
    { key: "brand", label: "Brand", priceChanging: true, values: ["Hikvision", "Dahua", "CP Plus", "Generic"] },
    { key: "storage_tb", label: "Storage (TB)", priceChanging: true, values: ["1", "2", "4"] },
    { key: "bundle_state", label: "Complete package or camera-only", priceChanging: true, values: ["complete_package", "camera_only"] },
    { key: "remote_viewing", label: "Remote phone viewing configured", priceChanging: false }
  ],
  sellerUnits: ["set", "piece"],
  normalizedUnit: "set",
  normalizedUnitRationale: "Buyers shop complete kits (cameras + recorder + storage + power); kit composition gates comparison, camera-only prices stay per piece.",
  questions: [
    q("camera_count", "How many cameras do you need?", "single_select", "always", { options: ["4", "8", "16", "Not sure"], allowUnknown: true }),
    q("system_type", "IP (network) or analogue system?", "single_select", "optional", { options: ["IP/PoE", "Analogue", "Not sure"], whyItMatters: "IP systems cost more but scale and resolve better." }),
    q("resolution_mp", "What resolution?", "single_select", "optional", { options: ["2MP", "4MP", "8MP", "Not sure"] }),
    q("bundle_state", "Complete package (recorder + storage + cabling) or cameras only?", "single_select", "always", { options: ["Complete package", "Cameras only"], allowUnknown: false }),
    q("installation_needed", "Include professional installation?", "yes_no", "always", { allowUnknown: false }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["system_type", "camera_count", "resolution_mp", "brand", "storage_tb", "bundle_state"],
    closeMatchKeys: ["system_type", "camera_count", "resolution_mp", "bundle_state"],
    neverComparableAcross: ["system_type", "bundle_state"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "security_low_voltage", secondary: "electrical_engineer", reason: "CCTV system design is low-voltage/security specialist domain." },
  samples: [
    sample("Hikvision 4-camera 2MP analogue kit, DVR + 1TB, complete package", 385e3, "set", "established_ecommerce", "Tests kit-composition matching."),
    sample("8MP IP dome camera, single unit", 95e3, "piece", "supplier_price_list", "Tests camera-only separation from kits.")
  ]
};
var ENERGY_SECURITY_FAMILIES = [
  SOLAR_PANELS,
  INVERTERS,
  BATTERIES,
  GENERATORS,
  CCTV_SECURITY
];

// src/price-intelligence/taxonomy/families/envelope.data.ts
var ROOFING = {
  key: "roofing",
  name: "Roofing sheets & accessories",
  // Spot-check additions 2026-07-28: sellers say "0.55 gauge", "shingle", "stone coated roofing tiles"; brands Gerard/Kristin/AMB with 50-year warranty claims
  marketNames: ["roofing sheet", "aluminium roofing", "stone coated", "step tile", "longspan", "long span", "gerard", "roofing", "shingle", "0.55 gauge", "stone coated roofing tiles"],
  parentCategory: "envelope",
  kind: "system",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "stone-coated", label: "Stone-coated steel tiles", aliases: ["gerard type", "milano", "bond", "shingle"] },
    { key: "longspan-aluminium", label: "Long-span aluminium", aliases: ["0.55 aluminium", "towergate type"] },
    { key: "step-tile-aluminium", label: "Step-tile aluminium" },
    { key: "corrugated", label: "Corrugated/metcoppo sheets" },
    { key: "accessories", label: "Ridges, flashings, gutters, fasteners", aliases: ["ridge cap", "flashing", "gutter"] }
  ],
  attributes: [
    { key: "sheet_type", label: "Sheet type", priceChanging: true, values: ["stone_coated", "longspan_aluminium", "step_tile", "corrugated"] },
    { key: "thickness_mm", label: "Thickness/gauge", priceChanging: true, values: ["0.45", "0.55", "0.7"] },
    { key: "profile", label: "Profile", priceChanging: true },
    { key: "brand", label: "Brand", priceChanging: true },
    { key: "colour", label: "Colour/coating", priceChanging: false },
    { key: "effective_width_m", label: "Effective width", priceChanging: true }
  ],
  sellerUnits: ["sqm", "piece", "bundle"],
  normalizedUnit: "sqm",
  normalizedUnitRationale: "Roofing quotes mix per-sheet and per-m\xB2. Sheet\u2192m\xB2 conversion requires effective width \xD7 length for the exact profile; prohibited otherwise (overlap eats coverage).",
  questions: [
    q("sheet_type", "Which roofing type?", "single_select", "always", { options: ["Stone-coated", "Long-span aluminium", "Step-tile aluminium", "Corrugated"], allowUnknown: true }),
    q("thickness_mm", "What thickness (gauge)?", "single_select", "always", { options: ["0.45mm", "0.55mm", "0.7mm"], whyItMatters: "0.45 vs 0.55 is the single biggest price driver in aluminium roofing.", allowUnknown: true }),
    q("roof_area", "Roughly how many square metres is the roof? (Your carpenter or drawing can tell you.)", "number", "always", { allowUnknown: true }),
    q("accessories_needed", "Should we include ridges, flashings and gutters?", "yes_no", "optional", { whyItMatters: "Accessories often add 10\u201320% that quotes hide." }),
    q("installation_needed", "Do you also want installation labour priced?", "yes_no", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["sheet_type", "thickness_mm", "profile", "brand"],
    closeMatchKeys: ["sheet_type", "thickness_mm"],
    neverComparableAcross: ["sheet_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, "accessory_only", "incomplete_bundle"],
  reviewers: { primary: "architect_interior", secondary: "structural_engineer", reason: "Profile/coverage is architectural; structural loading of tiles vs sheets is engineering." },
  samples: [
    sample("0.55 mm long-span aluminium, per m\xB2, Lagos supplier", 5800, "sqm", "established_ecommerce", "Tests thickness matching in m\xB2."),
    sample("Stone-coated bond tile, per piece (0.45 m\xB2 coverage stated)", 3900, "piece", "supplier_quotation", "Tests piece\u2192m\xB2 conversion with product-spec coverage.")
  ]
};
var WATERPROOFING = {
  key: "waterproofing",
  name: "Waterproofing materials & systems",
  // Spot-check additions 2026-07-28: felt/emulsion terminology (Bitunil, Armorseal), APP/SBS modifier language
  marketNames: ["waterproofing", "bitumen membrane", "damp proof", "water guard", "tanking", "flexseal", "bitumen felt", "roofing felt", "app membrane", "sbs membrane", "bitumen emulsion"],
  parentCategory: "envelope",
  kind: "system",
  applicableConditions: ["new"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "bituminous-membrane", label: "Torch-on bituminous membrane rolls" },
    { key: "cementitious", label: "Cementitious slurry systems" },
    { key: "liquid-membrane", label: "Liquid-applied membranes" },
    { key: "admixture", label: "Concrete waterproofing admixtures" }
  ],
  attributes: [
    { key: "system_type", label: "System type", priceChanging: true, values: ["bituminous_membrane", "cementitious", "liquid_membrane", "admixture"] },
    { key: "thickness_mm", label: "Membrane thickness", priceChanging: true, values: ["3", "4"] },
    { key: "brand", label: "Brand", priceChanging: true },
    { key: "coverage", label: "Coverage per unit", priceChanging: true }
  ],
  sellerUnits: ["roll", "litre", "kg", "sqm", "drum"],
  normalizedUnit: "sqm",
  normalizedUnitRationale: "Waterproofing decisions are made per m\xB2 of surface; roll/litre\u2192m\xB2 requires product-spec coverage.",
  questions: [
    q("surface", "What are you waterproofing?", "single_select", "always", { options: ["Flat roof/deck", "Bathroom/wet area", "Foundation/basement", "Water tank", "Other"], allowUnknown: true }),
    q("system_type", "Do you know which system you want?", "single_select", "optional", { options: ["Torch-on membrane", "Cement slurry", "Liquid membrane", "Not sure"], whyItMatters: "Systems differ in price and durability; \u201Cnot sure\u201D routes to professional guidance." }),
    q("area_sqm", "Roughly how many square metres?", "number", "always", { allowUnknown: true }),
    q("installation_needed", "Should we include application labour?", "yes_no", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["system_type", "thickness_mm", "brand"],
    closeMatchKeys: ["system_type", "thickness_mm"],
    neverComparableAcross: ["system_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, "incomplete_bundle"],
  reviewers: { primary: "building_services", secondary: "structural_engineer", reason: "System suitability spans wet services and structure; misapplication is a costly defect." },
  samples: [
    sample("4 mm torch-on membrane roll (10 m \xD7 1 m stated)", 38e3, "roll", "established_ecommerce", "Tests roll\u2192m\xB2 product-spec conversion."),
    sample("Cementitious slurry 25 kg bag (coverage 8 m\xB2 at 2 coats stated)", 42e3, "kg", "supplier_price_list", "Tests coverage-based normalisation gating.")
  ]
};
var DOORS = {
  key: "doors",
  name: "Doors",
  // Spot-check additions 2026-07-28: "Turkey door" variant, entrance/exit-door phrasing; sellers mislabel mm as m ("900m by 2100m")
  marketNames: ["door", "security door", "turkish door", "flush door", "panel door", "armored door", "armoured door", "turkey door", "turkey security door", "entrance door", "front door", "exit door"],
  parentCategory: "envelope",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "steel-security", label: "Steel security doors", aliases: ["turkish security door", "armoured door"] },
    { key: "hdf-flush", label: "HDF/flush internal doors" },
    { key: "solid-wood", label: "Solid wood panel doors" },
    { key: "glass", label: "Glass/aluminium doors" },
    { key: "pvc-bathroom", label: "PVC bathroom doors" }
  ],
  attributes: [
    { key: "material", label: "Material", priceChanging: true, values: ["steel", "hdf", "solid_wood", "glass_aluminium", "pvc"] },
    { key: "size", label: "Size (W\xD7H)", priceChanging: true, values: ["900x2100", "1200x2100", "double_1500x2100", "custom"] },
    { key: "use_position", label: "Internal or external", priceChanging: true, values: ["internal", "external"] },
    { key: "frame_included", label: "Frame included", priceChanging: true },
    { key: "lockset_included", label: "Lockset included", priceChanging: true },
    { key: "origin", label: "Local or imported", priceChanging: true, values: ["local", "turkish", "chinese", "other_import"] }
  ],
  sellerUnits: ["piece", "set"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Doors trade per unit; \u201Cset\u201D (door + frame + lockset) must be flagged and compared only with sets.",
  questions: [
    q("use_position", "Is this an entrance/external door or an internal room door?", "single_select", "always", { options: ["External/entrance", "Internal room", "Bathroom"], allowUnknown: false }),
    q("material", "What material do you want?", "single_select", "always", { options: ["Steel security", "HDF/flush", "Solid wood", "Glass/aluminium", "PVC", "Not sure"], allowUnknown: true }),
    q("size", "What door size? (Standard single is 900 mm \xD7 2100 mm.)", "single_select", "always", { options: ["Standard single (900\xD72100)", "Wide single (1200\xD72100)", "Double (1500\xD72100+)", "Custom \u2014 I will give measurements"], allowUnknown: true }),
    q("frame_lockset", "Do you need it complete with frame and lockset?", "yes_no", "always", { whyItMatters: "A \u201Cdoor\u201D price may exclude the frame and lock, which add a lot.", allowUnknown: false }),
    q("installation_needed", "Should we include installation?", "yes_no", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["material", "size", "use_position", "frame_included", "lockset_included", "origin"],
    closeMatchKeys: ["material", "size", "use_position"],
    neverComparableAcross: ["material"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "architect_interior", secondary: "quantity_surveyor", reason: "Door specification and finish grading are architectural." },
  samples: [
    sample("Turkish steel security door 900\xD72100, frame + lockset included", 385e3, "set", "established_ecommerce", "Tests set vs bare-door separation."),
    sample("HDF flush door 900\xD72100, door leaf only", 48e3, "piece", "classified_listing", "Tests frame_included=false comparison gating.")
  ]
};
var ALUMINIUM_WINDOWS = {
  key: "aluminium-windows",
  name: "Aluminium windows & glass systems",
  // Spot-check additions 2026-07-28: "Ghana window", projected/swing/frameless styles, net-position language ("with net", "sliding net")
  marketNames: ["aluminium window", "sliding window", "casement window", "window", "aluminum window", "glass window", "ghana window", "ghana sliding window", "projected window", "swing window", "frameless window", "window with net"],
  parentCategory: "envelope",
  kind: "system",
  applicableConditions: ["new"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "casement", label: "Casement windows" },
    { key: "sliding", label: "Sliding windows" },
    { key: "fixed-glazing", label: "Fixed glazing/curtain panels" },
    { key: "net-burglary", label: "Mosquito net & burglary bars add-ons" }
  ],
  attributes: [
    { key: "window_type", label: "Window type", priceChanging: true, values: ["casement", "sliding", "fixed"] },
    { key: "profile_gauge", label: "Aluminium profile/gauge", priceChanging: true, values: ["1.2mm", "1.5mm", "2.0mm"] },
    { key: "glass_type", label: "Glass type", priceChanging: true, values: ["clear_5mm", "tinted_5mm", "reflective", "double_glazed"] },
    { key: "size", label: "Size (W\xD7H)", priceChanging: true },
    { key: "net_included", label: "Mosquito net included", priceChanging: true },
    { key: "burglary_included", label: "Burglary protection included", priceChanging: true }
  ],
  sellerUnits: ["sqm", "piece", "set"],
  normalizedUnit: "sqm",
  normalizedUnitRationale: "Fabricators price per m\xB2 of fabricated window; fixed-size \u201Cpiece\u201D quotes convert via stated dimensions only.",
  questions: [
    q("window_type", "Casement or sliding windows?", "single_select", "always", { options: ["Casement", "Sliding", "Fixed glazing", "Not sure"], whyItMatters: "Casement windows use more profile and glass, so they cost more per m\xB2.", allowUnknown: true }),
    q("glass_type", "What glass do you want?", "single_select", "always", { options: ["Clear 5mm", "Tinted 5mm", "Reflective", "Double glazed", "Not sure"], allowUnknown: true }),
    q("sizes", "List your window sizes (e.g. 1200\xD71200 \xD7 4 windows). A photo of your window schedule also works.", "free_text", "always", { allowUnknown: true }),
    q("net_burglary", "Include mosquito nets and burglary bars?", "multi_select", "optional", { options: ["Mosquito net", "Burglary bars", "Neither"] }),
    q("installation_needed", "Include fabrication + installation?", "yes_no", "always", { allowUnknown: false }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["window_type", "profile_gauge", "glass_type", "net_included", "burglary_included"],
    closeMatchKeys: ["window_type", "glass_type"],
    neverComparableAcross: ["window_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...EQUIPMENT_RISK_FLAGS],
  reviewers: { primary: "architect_interior", secondary: "quantity_surveyor", reason: "Window schedules, profiles and glazing specs are architectural." },
  samples: [
    sample("Sliding window, 1.2 mm profile, clear 5 mm glass, per m\xB2 fabricated", 65e3, "sqm", "supplier_quotation", "Tests per-m\xB2 fabrication pricing."),
    sample("Casement 1200\xD71200 with net, per window", 145e3, "piece", "merchant_confirmed", "Tests piece\u2192m\xB2 dimension conversion.")
  ]
};
var ENVELOPE_FAMILIES = [ROOFING, WATERPROOFING, DOORS, ALUMINIUM_WINDOWS];

// src/price-intelligence/taxonomy/families/finishes.data.ts
var TILES = {
  key: "tiles",
  name: "Tiles, adhesive & grout",
  // Spot-check additions 2026-07-28: "compound tiles" (outdoor), "super polish" finish language; carton coverage stated as "1.44sqm in a carton, 4pcs"
  marketNames: ["tiles", "floor tiles", "wall tiles", "porcelain", "ceramic tiles", "spanish tiles", "granite tiles", "vitrified", "compound tiles", "super polish tiles"],
  parentCategory: "finishes",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "ceramic-floor", label: "Ceramic floor tiles" },
    { key: "porcelain-floor", label: "Porcelain/vitrified floor tiles" },
    { key: "wall-tiles", label: "Wall tiles" },
    { key: "granite-tiles", label: "Granite tiles" },
    { key: "adhesive-grout", label: "Tile adhesive & grout", aliases: ["tile gum", "grout"] }
  ],
  attributes: [
    { key: "tile_type", label: "Tile type", priceChanging: true, values: ["ceramic", "porcelain", "granite"] },
    { key: "application", label: "Floor or wall", priceChanging: true, values: ["floor", "wall"] },
    { key: "size_cm", label: "Dimensions", priceChanging: true, values: ["25x40", "30x30", "30x60", "40x40", "60x60", "120x60"] },
    { key: "origin_brand", label: "Origin/brand", priceChanging: true, values: ["nigerian", "chinese", "indian", "spanish", "italian"] },
    { key: "grade", label: "Grade", priceChanging: true, values: ["standard", "premium"] },
    { key: "sqm_per_carton", label: "m\xB2 per carton", priceChanging: false }
  ],
  sellerUnits: ["carton", "sqm"],
  normalizedUnit: "sqm",
  normalizedUnitRationale: "Cartons cover different areas by tile size; comparison is only honest per m\xB2, converted with the exact product\u2019s m\xB2-per-carton. Original carton price is always preserved.",
  questions: [
    q("application", "Floor tiles or wall tiles?", "single_select", "always", { options: ["Floor", "Wall"], allowUnknown: false }),
    q("size_cm", "What tile size?", "single_select", "always", { options: ["25\xD740", "30\xD730", "30\xD760", "40\xD740", "60\xD760", "120\xD760", "Not sure"], allowUnknown: true }),
    q("tile_type", "Ceramic, porcelain or granite?", "single_select", "always", { options: ["Ceramic", "Porcelain/vitrified", "Granite", "Not sure"], whyItMatters: "Porcelain costs more than ceramic at the same size; granite more again.", allowUnknown: true }),
    q("origin_brand", "Any origin preference (Nigerian, Spanish, Indian, Chinese)?", "single_select", "optional", { options: ["Nigerian", "Spanish", "Indian", "Chinese", "No preference"] }),
    q("area_sqm", "How many square metres are you tiling?", "number", "always", { whyItMatters: "We add standard cutting wastage to estimate cartons.", allowUnknown: true }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["tile_type", "application", "size_cm", "origin_brand", "grade"],
    closeMatchKeys: ["tile_type", "application", "size_cm"],
    neverComparableAcross: ["application", "tile_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, "smaller_spec"],
  reviewers: { primary: "architect_interior", secondary: "quantity_surveyor", reason: "Tile grading/wastage norms are finishing domain; carton coverage arithmetic is QS." },
  samples: [
    sample("60\xD760 porcelain, Nigerian brand, carton of 4 pcs (1.44 m\xB2 stated)", 18e3, "carton", "established_ecommerce", "Tests carton\u2192m\xB2 conversion with product-spec factor."),
    sample("30\xD760 ceramic wall tile, per m\xB2, Orile market", 7800, "sqm", "merchant_confirmed", "Tests direct per-m\xB2 observation.")
  ]
};
var PAINT = {
  key: "paint",
  name: "Paint systems",
  // Spot-check additions 2026-07-28: finish-first naming (matt/silk/satin emulsion), "drum" = 20L container, hybrid emulsion lines (Berger Clinstay)
  marketNames: ["paint", "emulsion", "satin", "gloss", "texcote", "screeding", "pop paint", "dulux", "matt emulsion", "silk paint", "satin emulsion", "hybrid emulsion", "drum of paint"],
  parentCategory: "finishes",
  kind: "system",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "emulsion", label: "Emulsion (matt) wall paint" },
    { key: "satin-silk", label: "Satin/silk washable paint" },
    { key: "gloss", label: "Oil/gloss paint" },
    { key: "texture", label: "Textured coating", aliases: ["texcote"] },
    { key: "screeding", label: "Screeding/filler", aliases: ["pop screeding"] },
    { key: "primer-sealer", label: "Primer/sealer" }
  ],
  attributes: [
    { key: "paint_type", label: "Paint type", priceChanging: true, values: ["emulsion", "satin", "gloss", "texture", "screeding", "primer"] },
    { key: "brand_tier", label: "Brand tier", priceChanging: true, values: ["premium (Dulux/Berger)", "mid (Meyer/Finecoat)", "economy"] },
    { key: "pack_size", label: "Pack size", priceChanging: true, values: ["20L bucket", "4L gallon"] }
  ],
  sellerUnits: ["bucket_20l", "gallon_4l", "litre"],
  normalizedUnit: "litre",
  normalizedUnitRationale: "Bucket and gallon prices normalise deterministically to per litre (fixed pack sizes in canonical units).",
  questions: [
    q("paint_type", "What type of paint?", "single_select", "always", { options: ["Emulsion (matt)", "Satin/silk (washable)", "Gloss", "Textured (Texcote type)", "Screeding", "Primer"], allowUnknown: true }),
    q("brand_tier", "Premium brand or budget?", "single_select", "always", { options: ["Premium (Dulux, Berger)", "Mid-range (Meyer, Finecoat)", "Economy", "Not sure"], allowUnknown: true }),
    q("surface_area", "Roughly what area are you painting (m\xB2) or how many rooms?", "free_text", "optional", { whyItMatters: "Helps estimate buckets needed, including two coats." }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["paint_type", "brand_tier", "pack_size"],
    closeMatchKeys: ["paint_type", "brand_tier"],
    neverComparableAcross: ["paint_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: "architect_interior", secondary: "quantity_surveyor", reason: "Coating systems and coverage norms are finishing domain." },
  samples: [
    sample("Premium emulsion, 20 L bucket, Lagos", 42e3, "bucket_20l", "established_ecommerce", "Tests bucket\u2192litre fixed conversion."),
    sample("Textured coating, 4 L gallon, mid brand", 9500, "gallon_4l", "merchant_confirmed", "Tests pack-size separation.")
  ]
};
var POP_CEILINGS = {
  key: "pop-ceilings",
  name: "POP, gypsum & ceiling systems",
  // Spot-check additions 2026-07-28: "pop cement"/"gypsum pop cement" is the dominant material name; "plaster board"; product vs installation-service ads mix in searches
  marketNames: ["pop", "pop ceiling", "gypsum board", "gypsum ceiling", "suspended ceiling", "pvc ceiling", "ceiling", "pop cement", "gypsum pop cement", "white pop cement", "plaster board", "ceiling pop"],
  parentCategory: "finishes",
  kind: "system",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "gypsum-board", label: "Gypsum boards" },
    { key: "pop-cement", label: "POP cement (plaster of Paris)" },
    { key: "suspended-grid", label: "Suspended ceiling tiles & grid" },
    { key: "pvc-panels", label: "PVC ceiling panels" },
    { key: "accessories", label: "Channels, screws, mesh, cornice" }
  ],
  attributes: [
    { key: "system_type", label: "System", priceChanging: true, values: ["gypsum_board", "pop_wet", "suspended", "pvc"] },
    { key: "board_size", label: "Board/panel size", priceChanging: true, values: ["1200x1200", "1220x2440", "600x600"] },
    { key: "thickness_mm", label: "Thickness", priceChanging: true, values: ["9", "12"] },
    { key: "brand", label: "Brand", priceChanging: true }
  ],
  sellerUnits: ["piece", "bag_40kg", "sqm", "bundle"],
  normalizedUnit: "sqm",
  normalizedUnitRationale: "Ceiling budgets are per m\xB2 of ceiling; board\u2192m\xB2 converts via stated board dimensions.",
  questions: [
    q("system_type", "Which ceiling system?", "single_select", "always", { options: ["Gypsum board", "Wet POP", "Suspended ceiling", "PVC panels", "Not sure"], allowUnknown: true }),
    q("area_sqm", "How many square metres of ceiling?", "number", "always", { allowUnknown: true }),
    q("design_complexity", "Simple flat ceiling or a design (bulkheads, curves, lighting troughs)?", "single_select", "optional", { options: ["Simple flat", "Some design", "Full designer ceiling"], whyItMatters: "Designed ceilings consume more material and labour per m\xB2." }),
    q("installation_needed", "Include installation labour?", "yes_no", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["system_type", "board_size", "thickness_mm", "brand"],
    closeMatchKeys: ["system_type", "thickness_mm"],
    neverComparableAcross: ["system_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, "incomplete_bundle"],
  reviewers: { primary: "architect_interior", secondary: "quantity_surveyor", reason: "Ceiling systems and design complexity are finishing domain." },
  samples: [
    sample("Gypsum board 1220\xD72440\xD712 mm, per board", 12500, "piece", "established_ecommerce", "Tests board\u2192m\xB2 conversion via dimensions."),
    sample("POP cement 40 kg bag", 9800, "bag_40kg", "merchant_confirmed", "Tests wet-POP material unit.")
  ]
};
var EXTERNAL_PAVING = {
  key: "external-paving",
  name: "German flooring, interlocking stones & external paving",
  // Spot-check additions 2026-07-28: "interlock stone", per-piece + design names ("T design"); most ads are production+installation services
  marketNames: ["german floor", "german flooring", "interlocking", "interlocking stones", "paving stone", "kerb", "compound flooring", "interlock stone", "interlock", "pavers"],
  parentCategory: "finishes",
  kind: "system",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "interlocking-paver", label: "Interlocking paving stones", aliases: ["60mm paver", "80mm paver"] },
    { key: "german-concrete", label: "Cast concrete \u201CGerman\u201D floor" },
    { key: "kerbs", label: "Kerbs and edge restraints" },
    { key: "stamped-concrete", label: "Stamped/increte concrete" }
  ],
  attributes: [
    { key: "system_type", label: "System", priceChanging: true, values: ["interlocking", "german_cast", "stamped"] },
    { key: "paver_thickness_mm", label: "Paver thickness", priceChanging: true, values: ["60", "80"] },
    { key: "includes_material_labour", label: "Material + laying bundled", priceChanging: true }
  ],
  sellerUnits: ["sqm", "piece"],
  normalizedUnit: "sqm",
  normalizedUnitRationale: "Compound paving is universally negotiated per m\xB2; \u201Cwith laying\u201D vs \u201Cmaterial only\u201D must be separated.",
  questions: [
    q("system_type", "Interlocking stones or cast concrete (German) floor?", "single_select", "always", { options: ["Interlocking stones", "Cast concrete/German floor", "Stamped concrete", "Not sure"], allowUnknown: true }),
    q("paver_thickness_mm", "What paver thickness \u2014 60 mm (foot traffic) or 80 mm (vehicles)?", "single_select", "conditional", {
      options: ["60mm", "80mm", "Not sure"],
      dependsOn: { questionId: "system_type", valueIn: ["Interlocking stones"] },
      whyItMatters: "80 mm pavers carry vehicles and cost more."
    }),
    q("area_sqm", "How many square metres of compound?", "number", "always", { allowUnknown: true }),
    q("with_laying", "Do you want material only, or material + laying?", "single_select", "always", { options: ["Material only", "Material + laying"], allowUnknown: false }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["system_type", "paver_thickness_mm", "includes_material_labour"],
    closeMatchKeys: ["system_type", "paver_thickness_mm"],
    neverComparableAcross: ["system_type", "includes_material_labour"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, "incomplete_bundle"],
  reviewers: { primary: "quantity_surveyor", secondary: "structural_engineer", reason: "Material-vs-labour separation and m\xB2 rate build-ups are QS core." },
  samples: [
    sample("80 mm interlocking paver, material + laying, per m\xB2, Lagos", 11e3, "sqm", "supplier_quotation", "Tests bundled labour separation flag."),
    sample("60 mm paver, material only, per m\xB2, Ogun factory", 6500, "sqm", "merchant_confirmed", "Tests thickness + bundle matching.")
  ]
};
var KITCHEN_CABINETS = {
  key: "kitchen-cabinets",
  name: "Kitchen cabinets & worktops",
  // Spot-check additions 2026-07-28: HDF is the defining material term; ready-made/portable (ft-sized) vs custom-fabrication ads; marble-top phrasing
  marketNames: ["kitchen cabinet", "kitchen", "cabinet", "wardrobe kitchen", "worktop", "countertop", "granite top", "hdf kitchen cabinet", "hdf cabinet", "ready-made kitchen cabinet", "portable kitchen cabinet", "marble top kitchen cabinet"],
  parentCategory: "finishes",
  kind: "system",
  applicableConditions: ["new"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "base-wall-units", label: "Base & wall cabinet units" },
    { key: "worktop", label: "Worktops (granite/quartz/marble/laminate)" },
    { key: "island", label: "Kitchen islands" },
    { key: "hardware", label: "Hinges, rails, handles (hardware grade)" }
  ],
  attributes: [
    { key: "carcass_material", label: "Carcass material", priceChanging: true, values: ["marine_board", "hdf", "particle_board"] },
    { key: "door_finish", label: "Door finish", priceChanging: true, values: ["hdf_spray", "laminate", "pvc_wrap", "glass"] },
    { key: "worktop_material", label: "Worktop material", priceChanging: true, values: ["granite", "quartz", "marble", "laminate"] },
    { key: "hardware_grade", label: "Hardware grade", priceChanging: true, values: ["standard", "soft_close_premium"] },
    { key: "pricing_basis", label: "Per linear metre or complete kitchen", priceChanging: true, values: ["linear_metre", "complete_kitchen"] },
    { key: "appliances_included", label: "Appliances included", priceChanging: true }
  ],
  sellerUnits: ["linear_metre", "job", "sqm"],
  normalizedUnit: "linear_metre",
  normalizedUnitRationale: "Fabricators quote per running metre of cabinetry; \u201Ccomplete kitchen\u201D lump sums compare only when the metreage and inclusions are stated.",
  questions: [
    q("kitchen_size", "How long is the cabinet run (linear metres), or share your kitchen dimensions/photo?", "free_text", "always", { allowUnknown: true }),
    q("carcass_material", "What carcass material?", "single_select", "always", { options: ["Marine board (moisture resistant)", "HDF", "Particle board", "Not sure"], whyItMatters: "Marine board resists Nigerian kitchen humidity and costs more.", allowUnknown: true }),
    q("worktop_material", "What worktop?", "single_select", "always", { options: ["Granite", "Quartz", "Marble", "Laminate", "Not sure"], allowUnknown: true }),
    q("appliances_included", "Should appliances (sink, hob, hood) be part of the quote?", "yes_no", "always", { allowUnknown: false }),
    q("installation_needed", "Include fabrication + installation?", "yes_no", "always", { allowUnknown: false }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["carcass_material", "door_finish", "worktop_material", "hardware_grade", "pricing_basis"],
    closeMatchKeys: ["carcass_material", "worktop_material", "pricing_basis"],
    neverComparableAcross: ["pricing_basis"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "architect_interior", secondary: "quantity_surveyor", reason: "Kitchen specification and finish grading are interior domain; rate structures are QS." },
  samples: [
    sample("Marine board carcass + HDF spray doors, per linear metre incl. installation", 185e3, "linear_metre", "supplier_quotation", "Tests linear-metre basis with installation included."),
    sample("Complete 3.6 m L-kitchen with granite top, lump sum", 95e4, "job", "classified_listing", "Tests complete-kitchen bundle gating (needs metreage to compare).")
  ]
};
var SANITARY_WARES = {
  key: "sanitary-wares",
  name: "Sanitary wares & bathroom fittings",
  // Spot-check additions 2026-07-28: "complete set" is the key inclusion phrase; Twyford used generically; "wash hand basin", 2-piece WC
  marketNames: ["wc", "water closet", "toilet", "basin", "shower", "mixer", "tap", "sanitary ware", "bathroom set", "jacuzzi", "wc set", "water closet set", "complete set wc", "wash hand basin", "2 piece wc", "twyford"],
  parentCategory: "finishes",
  kind: "accessory_set",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "wc-close-coupled", label: "Close-coupled WC sets" },
    { key: "wc-wall-hung", label: "Wall-hung WC + concealed cistern" },
    { key: "basin", label: "Wash-hand basins" },
    { key: "taps-mixers", label: "Taps & mixers" },
    { key: "shower-sets", label: "Showers & shower sets" },
    { key: "bathtub", label: "Bathtubs/jacuzzis" },
    { key: "complete-set", label: "Complete bathroom sets" }
  ],
  attributes: [
    { key: "item_or_set", label: "Single item or complete set", priceChanging: true, values: ["item", "complete_set"] },
    { key: "mounting", label: "Mounting", priceChanging: true, values: ["floor", "wall_hung", "concealed"] },
    { key: "brand_tier", label: "Brand/origin tier", priceChanging: true, values: ["premium_european", "mid (Twyford-type)", "economy"] },
    { key: "fittings_included", label: "Fittings/accessories included", priceChanging: true }
  ],
  sellerUnits: ["piece", "set"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Items trade per piece; complete sets are compared only with sets of stated composition.",
  questions: [
    q("item_or_set", "One item (e.g. WC) or a complete bathroom set?", "single_select", "always", { options: ["Single item", "Complete bathroom set"], allowUnknown: false }),
    q("which_item", "Which item?", "single_select", "conditional", {
      options: ["WC (toilet)", "Basin", "Tap/mixer", "Shower set", "Bathtub"],
      dependsOn: { questionId: "item_or_set", valueIn: ["Single item"] }
    }),
    q("mounting", "Floor-mounted or wall-hung (concealed cistern)?", "single_select", "conditional", {
      options: ["Floor-mounted", "Wall-hung/concealed", "Not sure"],
      dependsOn: { questionId: "which_item", valueIn: ["WC (toilet)"] },
      whyItMatters: "Wall-hung WCs need a concealed cistern and cost significantly more with installation."
    }),
    q("brand_tier", "Premium European, mid-range or economy?", "single_select", "always", { options: ["Premium European", "Mid-range (Twyford type)", "Economy", "Not sure"], allowUnknown: true }),
    q("installation_needed", "Include plumbing installation?", "yes_no", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["item_or_set", "mounting", "brand_tier", "fittings_included"],
    closeMatchKeys: ["item_or_set", "mounting"],
    neverComparableAcross: ["item_or_set"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "building_services", secondary: "architect_interior", reason: "Sanitary connections are wet-services domain; finish tiering is interior." },
  samples: [
    sample("Close-coupled WC set, mid brand, with seat + fittings", 95e3, "set", "established_ecommerce", "Tests set composition flag."),
    sample("Basin mixer tap, premium brand, item only", 48e3, "piece", "classified_listing", "Tests item vs set separation.")
  ]
};
var FINISHES_FAMILIES = [
  TILES,
  PAINT,
  POP_CEILINGS,
  EXTERNAL_PAVING,
  KITCHEN_CABINETS,
  SANITARY_WARES
];

// src/price-intelligence/taxonomy/families/mep.data.ts
var ELECTRICAL_CABLES = {
  key: "electrical-cables",
  name: "Electrical cables",
  // Spot-check additions 2026-07-28: "single cable"/"1core", coil language ("full roll", "factory coil", "100 meters"), "3c" shorthand for 3-core flexible
  marketNames: ["cable", "wire", "2.5mm wire", "coleman", "cutix", "nigerchin", "armoured cable", "flex wire", "single cable", "single core cable", "1core", "3c cable", "flexible cable", "full roll", "factory coil"],
  parentCategory: "mep",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "single-core", label: "Single-core house wiring" },
    { key: "flexible", label: "Flexible multi-strand cables" },
    { key: "armoured", label: "Armoured (SWA) cables" },
    { key: "coaxial-data", label: "Coaxial/data cables" }
  ],
  attributes: [
    { key: "brand", label: "Brand", priceChanging: true, values: ["Coleman", "Cutix", "Nigerchin", "Other"] },
    { key: "cable_type", label: "Cable type", priceChanging: true, values: ["single_core", "flexible", "armoured"] },
    { key: "size_sqmm", label: "Conductor size (mm\xB2)", priceChanging: true, values: ["1.0", "1.5", "2.5", "4", "6", "10", "16", "25"] },
    { key: "cores", label: "Number of cores", priceChanging: true, values: ["1", "2", "3", "4"] },
    { key: "conductor", label: "Conductor material", priceChanging: true, values: ["pure_copper", "copper_clad_aluminium"] },
    { key: "coil_length", label: "Coil/drum length", priceChanging: true }
  ],
  sellerUnits: ["coil", "metre"],
  normalizedUnit: "metre",
  normalizedUnitRationale: "Coils vary (100 yards vs 90 m vs 50 m drums); per-metre comparison requires the seller-stated coil length. Counterfeit/CCA \u201Ccopper\u201D is a known hazard \u2014 brand and conductor material gate matching.",
  questions: [
    q("size_sqmm", "What cable size (mm\xB2)? Your electrician\u2019s load schedule specifies this.", "single_select", "always", { options: ["1.0", "1.5", "2.5", "4", "6", "10", "16", "25"], allowUnknown: true }),
    q("cable_type", "Single-core wiring, flexible, or armoured cable?", "single_select", "always", { options: ["Single-core", "Flexible", "Armoured"], allowUnknown: true }),
    q("brand", "Which brand? (Coleman, Cutix, Nigerchin\u2026)", "brand_search", "always", { whyItMatters: "Cable is the most counterfeited electrical product in Nigeria; brand determines both price and safety." }),
    q("conductor", "Pure copper or copper-clad aluminium?", "single_select", "professional_review", { options: ["Pure copper", "Copper-clad aluminium", "Not sure"], whyItMatters: "CCA cable is cheaper but carries less current \u2014 an electrician should confirm suitability." }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["brand", "cable_type", "size_sqmm", "cores", "conductor"],
    closeMatchKeys: ["cable_type", "size_sqmm", "cores"],
    neverComparableAcross: ["size_sqmm", "conductor"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, "smaller_spec"],
  reviewers: { primary: "electrical_engineer", secondary: "quantity_surveyor", reason: "Conductor sizing and counterfeit risk are electrical-safety domain." },
  samples: [
    sample("Coleman 2.5 mm\xB2 single-core, 100-yard coil, Dosunmu market", 68e3, "coil", "merchant_confirmed", "Tests coil\u2192metre seller-stated conversion."),
    sample("4-core 16 mm\xB2 armoured cable, per metre", 9500, "metre", "supplier_quotation", "Tests armoured type separation.")
  ]
};
var ELECTRICAL_PROTECTION = {
  key: "electrical-protection",
  name: "Electrical protection & wiring accessories",
  // Spot-check additions 2026-07-28: knife vs automatic changeover (ATS), fuse units; manual/automatic distinction is a huge price driver
  marketNames: ["distribution board", "db box", "breaker", "mcb", "changeover", "socket", "switch", "consumer unit", "change over switch", "changeover switch", "transfer switch", "ats", "knife switch", "fuse unit"],
  parentCategory: "mep",
  kind: "accessory_set",
  applicableConditions: ["new"],
  funnelRole: "paid_research",
  subProducts: [
    { key: "distribution-board", label: "Distribution boards / consumer units" },
    { key: "breakers", label: "MCB/MCCB/RCCB breakers" },
    { key: "changeover", label: "Changeover switches (manual/automatic)" },
    { key: "sockets-switches", label: "Sockets & switches" },
    { key: "earthing", label: "Earthing materials" }
  ],
  attributes: [
    { key: "item_type", label: "Item", priceChanging: true, values: ["db", "mcb", "rccb", "changeover_manual", "changeover_auto", "socket", "switch"] },
    { key: "ways_or_rating", label: "Ways (DB) or amp rating", priceChanging: true },
    { key: "brand", label: "Brand", priceChanging: true, values: ["Schneider", "ABB", "Hager", "MK", "Crabtree-type", "Economy"] },
    { key: "phase", label: "Single or three phase", priceChanging: true, values: ["single", "three"] }
  ],
  sellerUnits: ["piece", "set"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Protection devices trade per piece; DB \u201Cpopulated vs empty\u201D must be flagged as bundle state.",
  questions: [
    q("item_type", "Which item do you need?", "single_select", "always", { options: ["Distribution board", "Breaker (MCB/RCCB)", "Changeover switch", "Sockets & switches", "Earthing materials"], allowUnknown: false }),
    q("ways_or_rating", "What size \u2014 number of ways (DB) or amp rating (breaker/changeover)?", "free_text", "always", { allowUnknown: true }),
    q("phase", "Single-phase or three-phase supply?", "single_select", "always", { options: ["Single-phase", "Three-phase", "Not sure"], allowUnknown: true }),
    q("brand", "Brand preference?", "brand_search", "optional", { whyItMatters: "Genuine Schneider/ABB devices cost multiples of economy brands." }),
    q("populated", "For a DB: empty board or populated with breakers?", "single_select", "conditional", {
      options: ["Empty", "Populated with breakers"],
      dependsOn: { questionId: "item_type", valueIn: ["Distribution board"] }
    }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["item_type", "ways_or_rating", "brand", "phase"],
    closeMatchKeys: ["item_type", "ways_or_rating", "phase"],
    neverComparableAcross: ["item_type", "phase"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...EQUIPMENT_RISK_FLAGS],
  reviewers: { primary: "electrical_engineer", reason: "Protection sizing and counterfeit detection are electrical-safety domain." },
  samples: [
    sample("12-way single-phase DB, populated, mid brand", 145e3, "set", "supplier_quotation", "Tests populated-vs-empty bundle flag."),
    sample("63A manual changeover, per piece", 38e3, "piece", "merchant_confirmed", "Tests rating-based matching.")
  ]
};
var PLUMBING_PIPES = {
  key: "plumbing-pipes",
  name: "Plumbing pipes & fittings",
  // Spot-check additions 2026-07-28: brand-led naming (Sanica, IPS, Polytech), "hot and cold" phrasing, bar-rated PVC ("7 bar")
  marketNames: ["pvc pipe", "ppr pipe", "pressure pipe", "waste pipe", "tigre", "pipes", "fittings", "elbow", "conduit pipe", "ips pipe", "sanica", "hot and cold pipe", "ppr connectors"],
  parentCategory: "mep",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "pvc-pressure", label: "PVC pressure pipes" },
    { key: "pvc-waste", label: "PVC waste/soil pipes" },
    { key: "ppr", label: "PPR hot/cold pipes" },
    { key: "conduit", label: "Electrical conduit pipes" },
    { key: "fittings", label: "Fittings (elbows, tees, sockets, valves)" }
  ],
  attributes: [
    { key: "pipe_type", label: "Pipe type", priceChanging: true, values: ["pvc_pressure", "pvc_waste", "ppr", "conduit"] },
    { key: "diameter_inch", label: "Diameter", priceChanging: true, values: ["1/2", "3/4", "1", "1.5", "2", "3", "4"] },
    { key: "brand", label: "Brand", priceChanging: true },
    { key: "pressure_class", label: "Pressure class (PPR/pressure)", priceChanging: true, values: ["PN10", "PN16", "PN20"] }
  ],
  sellerUnits: ["length_5_8m", "piece", "metre"],
  normalizedUnit: "length_5_8m",
  normalizedUnitRationale: "Nigerian pipe lengths are ~5.8 m standard; fittings stay per piece \u2014 pipes and fittings never cross-compare.",
  questions: [
    q("pipe_type", "What pipe type \u2014 pressure (water supply), waste, PPR (hot water) or conduit?", "single_select", "always", { options: ["PVC pressure", "PVC waste", "PPR", "Conduit"], allowUnknown: true }),
    q("diameter_inch", "What diameter?", "single_select", "always", { options: ['1/2"', '3/4"', '1"', '1.5"', '2"', '3"', '4"'], allowUnknown: true }),
    q("brand", "Brand preference?", "brand_search", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["pipe_type", "diameter_inch", "brand", "pressure_class"],
    closeMatchKeys: ["pipe_type", "diameter_inch"],
    neverComparableAcross: ["pipe_type", "diameter_inch"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: "building_services", secondary: "quantity_surveyor", reason: "Pipe classes and hot/cold suitability are wet-services domain." },
  samples: [
    sample("1-inch PVC pressure pipe, 5.8 m length", 4200, "length_5_8m", "merchant_confirmed", "Tests diameter + type matching."),
    sample('PPR 3/4" PN20, per length, premium brand', 7800, "length_5_8m", "established_ecommerce", "Tests pressure-class attribute.")
  ]
};
var WATER_PUMPS = {
  key: "water-pumps",
  name: "Water pumps",
  // Spot-check additions 2026-07-28: "Italian pump" as origin claim, stainless/flat-head/self-priming descriptors, sewage pumps in same searches
  marketNames: ["pumping machine", "water pump", "sumo", "surface pump", "submersible", "pedrollo", "booster pump", "italian pump", "stainless pump", "self priming pump", "flat head pump", "sewage pump"],
  parentCategory: "mep",
  kind: "product",
  applicableConditions: ["new", "used"],
  funnelRole: "both",
  subProducts: [
    { key: "surface", label: "Surface pumps" },
    { key: "submersible", label: "Submersible pumps", aliases: ["sumo"] },
    { key: "booster", label: "Pressure booster sets" },
    { key: "controller", label: "Pump controllers & pressure switches" }
  ],
  attributes: [
    { key: "pump_type", label: "Pump type", priceChanging: true, values: ["surface", "submersible", "booster"] },
    { key: "brand", label: "Brand", priceChanging: true, values: ["Pedrollo", "Grundfos", "Interdab", "Ingco/economy", "Other"] },
    { key: "horsepower", label: "Horsepower", priceChanging: true, values: ["0.5", "1", "1.5", "2", "3"] },
    { key: "head_m", label: "Pumping head (m)", priceChanging: true },
    { key: "condition", label: "New or used", priceChanging: true, values: ["new", "used"] },
    { key: "accessories_included", label: "Accessories/controller included", priceChanging: true }
  ],
  sellerUnits: ["piece"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Pumps trade per unit; type + HP + brand gate all comparisons, and used units never compare with new.",
  questions: [
    q("pump_type", "Surface pump (beside tank) or submersible (inside borehole/well)?", "single_select", "always", { options: ["Surface", "Submersible (sumo)", "Booster set", "Not sure"], allowUnknown: true }),
    q("horsepower", "What horsepower? (1 HP is the common house size.)", "single_select", "always", { options: ["0.5 HP", "1 HP", "1.5 HP", "2 HP", "3 HP", "Not sure"], allowUnknown: true }),
    q("brand", "Brand preference? Genuine Pedrollo vs clones is a big price difference.", "brand_search", "always", { whyItMatters: "Counterfeit \u201CPedrollo\u201D pumps are widespread; brand authenticity drives price." }),
    q("condition", "New or fairly used?", "single_select", "always", { options: ["New", "Fairly used"], allowUnknown: false }),
    q("installation_needed", "Include installation by a plumber?", "yes_no", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["pump_type", "brand", "horsepower", "condition"],
    closeMatchKeys: ["pump_type", "horsepower", "condition"],
    neverComparableAcross: ["pump_type", "condition"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: "building_services", secondary: "electrical_engineer", reason: "Pump sizing/head is mechanical; motor ratings electrical." },
  samples: [
    sample("Pedrollo 1 HP surface pump, new, boxed with warranty card", 95e3, "piece", "established_ecommerce", "Tests brand-authenticity attribute."),
    sample("1.5 HP submersible + controller, new, Jiji listing", 12e4, "piece", "classified_listing", "Tests accessories-included flag and Tier 3 caution.")
  ]
};
var WATER_TANKS = {
  key: "water-tanks",
  name: "Water-storage tanks",
  // Spot-check additions 2026-07-28: "GP tank"/"Gee Pee" spellings, "rubber tank" (plastic tank), Storex brand
  marketNames: ["water tank", "geepee tank", "storage tank", "overhead tank", "surface tank", "2000 litres tank", "gp tank", "gee pee tank", "rubber tank", "storex"],
  parentCategory: "mep",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "free_traffic",
  subProducts: [
    { key: "plastic-vertical", label: "Vertical plastic tanks" },
    { key: "plastic-horizontal", label: "Horizontal/loft plastic tanks" },
    { key: "stainless", label: "Stainless steel tanks" },
    { key: "underground", label: "Underground/septic tanks" }
  ],
  attributes: [
    { key: "material", label: "Material", priceChanging: true, values: ["plastic", "stainless_steel", "fibreglass"] },
    { key: "capacity_litres", label: "Capacity (litres)", priceChanging: true, values: ["500", "1000", "1500", "2000", "3000", "5000", "10000"] },
    { key: "brand", label: "Brand", priceChanging: true, values: ["GeePee", "Tank Africa-type", "Sonaz-type", "Other"] },
    { key: "layers", label: "Layer construction", priceChanging: true, values: ["single", "double", "triple"] }
  ],
  sellerUnits: ["piece"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Tanks trade per unit at stated capacity; capacity gates comparison (no per-litre normalisation \u2014 pricing is non-linear).",
  questions: [
    q("capacity_litres", "What tank capacity (litres)?", "single_select", "always", { options: ["500", "1000", "1500", "2000", "3000", "5000", "10000+"], allowUnknown: true }),
    q("material", "Plastic or stainless steel?", "single_select", "always", { options: ["Plastic", "Stainless steel", "Not sure"], allowUnknown: true }),
    q("brand", "Brand preference (GeePee etc.)?", "brand_search", "optional"),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["material", "capacity_litres", "brand", "layers"],
    closeMatchKeys: ["material", "capacity_litres"],
    neverComparableAcross: ["material", "capacity_litres"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: "building_services", reason: "Tank sizing and installation loads are services domain." },
  samples: [
    sample("GeePee 2000 L vertical tank, ex-store Lagos", 145e3, "piece", "established_ecommerce", "Tests capacity + brand matching."),
    sample("Stainless 1000 L tank, delivered Abuja", 26e4, "piece", "supplier_quotation", "Tests material separation.")
  ]
};
var MEP_FAMILIES = [
  ELECTRICAL_CABLES,
  ELECTRICAL_PROTECTION,
  PLUMBING_PIPES,
  WATER_PUMPS,
  WATER_TANKS
];

// src/price-intelligence/taxonomy/families/structural.data.ts
var CEMENT = {
  key: "cement",
  name: "Cement",
  // Spot-check additions 2026-07-28 (gpt-5.6-sol vs real Jiji listings): Lafarge misspellings, 3X product name
  marketNames: ["cement", "bag of cement", "dangote", "bua cement", "elephant cement", "siment", "cememt", "lafarge", "lafarg", "lafage", "3x cement"],
  parentCategory: "structural",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "free_traffic",
  subProducts: [
    { key: "opc-425", label: "Ordinary Portland 42.5 grade", aliases: ["42.5r", "42.5n", "grade 42.5"] },
    { key: "opc-325", label: "Limestone/Portland 32.5 grade", aliases: ["32.5"] },
    { key: "block-master", label: "Block-moulding cement variants", aliases: ["blocmaster", "3x"] }
  ],
  attributes: [
    { key: "brand", label: "Brand", priceChanging: true, values: ["Dangote", "BUA", "Lafarge (Elephant/Supaset)", "UniCem", "Other"] },
    { key: "grade", label: "Cement grade", priceChanging: true, values: ["42.5", "32.5"] },
    { key: "bag_weight", label: "Bag weight", priceChanging: true, values: ["50kg"] },
    { key: "purchase_type", label: "Retail or wholesale", priceChanging: true, values: ["retail", "wholesale_trailer"] }
  ],
  sellerUnits: ["bag_50kg", "trailer_600bags"],
  normalizedUnit: "bag_50kg",
  normalizedUnitRationale: "Nigerian cement trades universally per 50 kg bag; trailer prices divide deterministically by 600.",
  questions: [
    q("brand", "Which brand do you want?", "brand_search", "always", { whyItMatters: "Brands price differently and availability varies by area." }),
    q("grade", "Which grade \u2014 42.5 or 32.5?", "single_select", "conditional", {
      options: ["42.5", "32.5", "Not sure"],
      dependsOn: { questionId: "brand", valueIn: ["Lafarge (Elephant/Supaset)", "BUA", "Other"] },
      whyItMatters: "42.5 is the common structural grade; 32.5 variants are cheaper."
    }),
    q("purchase_type", "Are you buying retail bags or a full trailer (600 bags)?", "single_select", "always", { options: ["Retail bags", "Full trailer (600 bags)"], allowUnknown: false }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["brand", "grade", "bag_weight", "purchase_type"],
    closeMatchKeys: ["grade", "bag_weight", "purchase_type"],
    neverComparableAcross: ["purchase_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: "structural_engineer", secondary: "quantity_surveyor", reason: "Grade suitability is structural; unit/rate conventions are QS domain." },
  samples: [
    sample("Dangote 42.5R, 50 kg bag, ex-depot Lagos mainland", 9500, "bag_50kg", "merchant_confirmed", "Tests brand+grade+retail matching."),
    sample("BUA 42.5, 600-bag trailer, Ogun delivery included", 54e5, "trailer_600bags", "supplier_quotation", "Tests trailer\u2192bag fixed conversion and delivery inclusion.")
  ]
};
var REINFORCEMENT_STEEL = {
  key: "reinforcement-steel",
  name: "Reinforcement steel",
  // Spot-check additions 2026-07-28: sellers lead with "TMT" + brand (LCI, Monac, PSL, Lion) and per-ton pricing
  marketNames: ["iron rod", "rods", "reinforcement", "rebar", "y12", "y16", "12mm rod", "iron rods", "tmt", "tmt rod", "tmt iron rod", "tmt rebar"],
  parentCategory: "structural",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "both",
  subProducts: [
    { key: "deformed-bar", label: "Deformed high-yield bars (Y-bars)" },
    { key: "mild-bar", label: "Mild steel round bars (R-bars)" },
    { key: "brc-mesh", label: "BRC wire mesh", aliases: ["brc"] },
    { key: "binding-wire", label: "Binding wire" }
  ],
  attributes: [
    { key: "diameter_mm", label: "Diameter (mm)", priceChanging: true, values: ["8", "10", "12", "16", "20", "25"] },
    { key: "length_m", label: "Length", priceChanging: true, values: ["12m"] },
    { key: "origin", label: "Local or imported", priceChanging: true, values: ["local", "imported"] },
    { key: "grade", label: "Grade", priceChanging: true, values: ["grade60", "other"] }
  ],
  sellerUnits: ["length_12m", "tonne", "bundle"],
  normalizedUnit: "length_12m",
  normalizedUnitRationale: "Retail buyers purchase per 12 m length; tonne\u2194length converts via manufacturer mass tables once diameter is known (e.g. one 12 m Y12 \u2248 10.7 kg).",
  questions: [
    q("diameter_mm", "What rod diameter do you need?", "single_select", "always", { options: ["8mm", "10mm", "12mm", "16mm", "20mm", "25mm"], whyItMatters: "Price scales with diameter; your structural drawing specifies it.", allowUnknown: true }),
    q("origin", "Local or imported rods?", "single_select", "optional", { options: ["Local", "Imported", "Not sure"], whyItMatters: "Imported bars usually price higher per tonne." }),
    q("sell_unit", "Are you buying per length or per tonne?", "single_select", "always", { options: ["Per length", "Per tonne"], allowUnknown: false }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["diameter_mm", "length_m", "origin", "grade"],
    closeMatchKeys: ["diameter_mm", "length_m"],
    neverComparableAcross: ["diameter_mm"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: "structural_engineer", secondary: "quantity_surveyor", reason: "Bar schedules and grade suitability are structural; tonne/length rate build-ups are QS domain." },
  samples: [
    sample("12 mm local deformed bar, 12 m length, Owode Onirin", 14500, "length_12m", "merchant_confirmed", "Tests diameter matching and retail unit."),
    sample("16 mm imported, per tonne, Lagos", 125e4, "tonne", "supplier_price_list", "Tests tonne\u2192length manufacturer-spec conversion gating.")
  ]
};
var CONCRETE_BLOCKS = {
  key: "concrete-blocks",
  name: "Concrete blocks",
  // Spot-check additions 2026-07-28: stone-dust-based blocks, 4-inch size; block-search results are polluted by moulding-machine ads (see riskFlags)
  marketNames: ["blocks", "9 inch block", "6 inch block", "hollow block", "solid block", "vibrated block", "4 inch block", "stone dust block"],
  parentCategory: "structural",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "free_traffic",
  subProducts: [
    { key: "hollow-9", label: "9-inch hollow" },
    { key: "hollow-6", label: "6-inch hollow" },
    { key: "solid-6", label: "6-inch solid" },
    { key: "interlocking-block", label: "Interlocking building blocks" }
  ],
  attributes: [
    { key: "size_inch", label: "Size", priceChanging: true, values: ["9", "6", "5", "4"] },
    { key: "form", label: "Hollow or solid", priceChanging: true, values: ["hollow", "solid"] },
    { key: "moulding", label: "Vibrated or hand-mould", priceChanging: true, values: ["vibrated", "hand_mould"] }
  ],
  sellerUnits: ["piece"],
  normalizedUnit: "piece",
  normalizedUnitRationale: "Blocks trade per piece everywhere in Nigeria; bulk deals are still quoted per piece.",
  questions: [
    q("size_inch", "Which block size?", "single_select", "always", { options: ["9 inch", "6 inch", "5 inch", "4 inch"], allowUnknown: true }),
    q("form", "Hollow or solid?", "single_select", "always", { options: ["Hollow", "Solid"], whyItMatters: "Solid blocks cost more and are used for specific walls." }),
    q("moulding", "Vibrated (machine) or hand-mould?", "single_select", "optional", { options: ["Vibrated", "Hand-mould", "Not sure"], whyItMatters: "Vibrated blocks are stronger and cost slightly more." }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["size_inch", "form", "moulding"],
    closeMatchKeys: ["size_inch", "form"],
    neverComparableAcross: ["size_inch"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: "structural_engineer", secondary: "quantity_surveyor", reason: "Block strength/type suitability is structural." },
  samples: [
    sample("9-inch hollow vibrated block, ex-factory Mowe", 550, "piece", "merchant_confirmed", "Tests size+form+moulding matching."),
    sample("6-inch hollow, delivered Ajah (delivery included)", 520, "piece", "classified_listing", "Tests delivery-included flag on commodity.")
  ]
};
var SAND = {
  key: "sand",
  name: "Sand",
  // Spot-check addition 2026-07-28: "laterite sand" appears alongside sharp/plaster sand in supplier ads
  marketNames: ["sharp sand", "plaster sand", "filling sand", "sand supply", "tipper of sand", "erosion sand", "laterite sand"],
  parentCategory: "structural",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "free_traffic",
  subProducts: [
    { key: "sharp-sand", label: "Sharp sand (concrete/masonry)" },
    { key: "plaster-sand", label: "Plaster (smooth) sand" },
    { key: "filling-sand", label: "Filling/erosion sand" },
    { key: "stone-dust", label: "Stone dust", aliases: ["quarry dust"] }
  ],
  attributes: [
    { key: "sand_type", label: "Sand type", priceChanging: true, values: ["sharp", "plaster", "filling", "stone_dust"] },
    { key: "load_tonnage", label: "Load size (tonnes)", priceChanging: true, values: ["5", "10", "20", "30"] }
  ],
  sellerUnits: ["truckload", "tonne", "cubic_metre"],
  normalizedUnit: "tonne",
  normalizedUnitRationale: "\u201CTipper\u201D has no standard size; loads are only comparable via the seller-stated tonnage. Prices normalise to per tonne with the load size preserved.",
  questions: [
    q("sand_type", "What type of sand?", "single_select", "always", { options: ["Sharp sand", "Plaster sand", "Filling sand", "Stone dust"], whyItMatters: "Sharp, plaster and filling sand have very different prices and uses.", allowUnknown: true }),
    q("load_tonnage", "What load size (e.g. 20-tonne tipper)?", "single_select", "always", { options: ["5 tonnes", "10 tonnes", "20 tonnes", "30 tonnes"], allowUnknown: true }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["sand_type", "load_tonnage"],
    closeMatchKeys: ["sand_type"],
    neverComparableAcross: ["sand_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: "structural_engineer", secondary: "quantity_surveyor", reason: "Sand suitability for concrete vs plaster is a technical/structural call." },
  samples: [
    sample("Sharp sand, 20-tonne tipper, delivered Ikeja", 85e3, "truckload", "merchant_confirmed", "Tests seller-stated tonnage \u2192 per-tonne conversion."),
    sample("Plaster sand, 10-tonne load, Abeokuta", 45e3, "truckload", "classified_listing", "Tests type separation from sharp sand.")
  ]
};
var GRANITE_AGGREGATES = {
  key: "granite-aggregates",
  name: "Granite & aggregates",
  // Spot-check addition 2026-07-28: "stone dust" sold by the same aggregate suppliers, priced per ton
  marketNames: ["granite", "chippings", "gravel", "stone", "3/4 granite", "quarry stone", "aggregate", "stone dust"],
  parentCategory: "structural",
  kind: "product",
  applicableConditions: ["new"],
  funnelRole: "free_traffic",
  subProducts: [
    { key: "granite-34", label: "3/4-inch granite" },
    { key: "granite-12", label: "1/2-inch granite" },
    { key: "granite-14", label: "1/4-inch granite" },
    { key: "gravel", label: "Washed gravel" },
    { key: "hardcore", label: "Hardcore/boulder filling" }
  ],
  attributes: [
    { key: "stone_type", label: "Stone type", priceChanging: true, values: ["granite", "gravel", "hardcore"] },
    { key: "stone_size", label: "Stone size", priceChanging: true, values: ["3/4", "1/2", "1/4", "mixed"] },
    { key: "load_tonnage", label: "Load size (tonnes)", priceChanging: true, values: ["5", "10", "20", "30"] }
  ],
  sellerUnits: ["truckload", "tonne"],
  normalizedUnit: "tonne",
  normalizedUnitRationale: "Same as sand: loads compare only via seller-stated tonnage.",
  questions: [
    q("stone_type", "Granite, gravel or hardcore?", "single_select", "always", { options: ["Granite", "Gravel", "Hardcore"], allowUnknown: true }),
    q("stone_size", "What stone size (e.g. 3/4)?", "single_select", "conditional", {
      options: ["3/4", "1/2", "1/4", "Mixed"],
      dependsOn: { questionId: "stone_type", valueIn: ["Granite"] },
      whyItMatters: "3/4 granite is the standard for concrete; smaller sizes price differently."
    }),
    q("load_tonnage", "What load size?", "single_select", "always", { options: ["5 tonnes", "10 tonnes", "20 tonnes", "30 tonnes"], allowUnknown: true }),
    ...COMMON_QUESTIONS
  ],
  matching: {
    exactMatchKeys: ["stone_type", "stone_size", "load_tonnage"],
    closeMatchKeys: ["stone_type", "stone_size"],
    neverComparableAcross: ["stone_type"]
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: "structural_engineer", secondary: "quantity_surveyor", reason: "Aggregate grading suitability is structural." },
  samples: [
    sample("3/4 granite, 30-tonne load, ex-quarry Ogun", 38e4, "truckload", "supplier_quotation", "Tests granite size + tonnage normalisation."),
    sample("Washed gravel, 20 tonnes, Benin City delivery", 21e4, "truckload", "classified_listing", "Tests type separation and location tagging.")
  ]
};
var STRUCTURAL_FAMILIES = [
  CEMENT,
  REINFORCEMENT_STEEL,
  CONCRETE_BLOCKS,
  SAND,
  GRANITE_AGGREGATES
];

// src/price-intelligence/taxonomy/families/index.ts
var LEVEL1_FAMILIES = [
  ...STRUCTURAL_FAMILIES,
  ...ENVELOPE_FAMILIES,
  ...FINISHES_FAMILIES,
  ...MEP_FAMILIES,
  ...ENERGY_SECURITY_FAMILIES
];
var FAMILY_INDEX = new Map(LEVEL1_FAMILIES.map((f) => [f.key, f]));

// src/price-intelligence/taxonomy/services.data.ts
var BASE_SCOPE = [
  "labour_only_vs_labour_and_material",
  "location",
  "project_scale",
  "access_conditions",
  "transportation",
  "call_out_fee"
];
var SERVICE_FAMILIES = [
  {
    key: "tiling",
    name: "Tiling",
    marketNames: ["tiler", "tiling work", "laying tiles"],
    pricingBasis: "either",
    pricingUnits: ["sqm"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "tile_size", "floor_vs_wall", "screeding_required", "demolition_of_old_tiles", "disposal"],
    reviewers: { primary: "quantity_surveyor", secondary: "architect_interior", reason: "m\xB2 rate conventions are QS domain; finish quality is interior." }
  },
  {
    key: "painting",
    name: "Painting",
    marketNames: ["painter", "painting work"],
    pricingBasis: "either",
    pricingUnits: ["sqm", "room", "job"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "coats", "surface_preparation", "paint_type", "height_scaffolding", "interior_vs_exterior"],
    reviewers: { primary: "quantity_surveyor", secondary: "architect_interior", reason: "Coverage and coat norms are QS/finishing domain." }
  },
  {
    key: "screeding",
    name: "Screeding",
    marketNames: ["screeding work", "wall screeding"],
    pricingBasis: "either",
    pricingUnits: ["sqm"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "wall_vs_ceiling", "surface_condition", "coats"],
    reviewers: { primary: "quantity_surveyor", reason: "Rate build-up per m\xB2." }
  },
  {
    key: "pop-installation",
    name: "POP installation",
    marketNames: ["pop man", "pop work"],
    pricingBasis: "either",
    pricingUnits: ["sqm"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "design_complexity", "ceiling_height", "wet_pop_vs_board"],
    reviewers: { primary: "architect_interior", secondary: "quantity_surveyor", reason: "Design complexity drives labour." }
  },
  {
    key: "gypsum-ceiling-installation",
    name: "Gypsum ceiling installation",
    marketNames: ["gypsum ceiling work"],
    pricingBasis: "either",
    pricingUnits: ["sqm"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "design_complexity", "ceiling_height", "lighting_troughs"],
    reviewers: { primary: "architect_interior", reason: "Suspended-system specs are finishing domain." }
  },
  {
    key: "electrical-point-installation",
    name: "Electrical point installation",
    marketNames: ["electrician per point", "wiring per point"],
    pricingBasis: "either",
    pricingUnits: ["point"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "conduiting_vs_surface", "new_wiring_vs_rewiring", "chasing_required", "materials_included", "testing_commissioning"],
    reviewers: { primary: "electrical_engineer", secondary: "quantity_surveyor", reason: "Point definitions and safety standards are electrical domain." }
  },
  {
    key: "plumbing-point-installation",
    name: "Plumbing point installation",
    marketNames: ["plumber per point"],
    pricingBasis: "either",
    pricingUnits: ["point"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "hot_and_cold", "concealed_vs_surface", "materials_included", "pressure_testing"],
    reviewers: { primary: "building_services", secondary: "quantity_surveyor", reason: "Point scope definitions are wet-services domain." }
  },
  {
    key: "roofing-labour",
    name: "Roofing labour",
    marketNames: ["carpenter roofing", "roof installation"],
    pricingBasis: "labour_only",
    pricingUnits: ["sqm", "job"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "truss_type", "roof_pitch_complexity", "sheet_type", "height"],
    reviewers: { primary: "structural_engineer", secondary: "quantity_surveyor", reason: "Truss/pitch complexity is structural." }
  },
  {
    key: "window-fabrication-installation",
    name: "Window fabrication & installation",
    marketNames: ["aluminium fabricator"],
    pricingBasis: "labour_and_material",
    pricingUnits: ["sqm", "piece"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "profile_gauge", "glass_type", "floor_level", "net_burglary_addons"],
    reviewers: { primary: "architect_interior", reason: "Fabrication specs are architectural." }
  },
  {
    key: "door-installation",
    name: "Door installation",
    marketNames: ["carpenter door hanging"],
    pricingBasis: "labour_only",
    pricingUnits: ["piece"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "door_type", "frame_work_required", "lockset_fitting"],
    reviewers: { primary: "architect_interior", reason: "Door schedules are architectural." }
  },
  {
    key: "solar-installation",
    name: "Solar installation",
    marketNames: ["solar installer"],
    pricingBasis: "either",
    pricingUnits: ["job", "kva"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "system_size_kva", "roof_vs_ground_mount", "panel_count", "wiring_distance", "earthing", "testing_commissioning", "warranty"],
    reviewers: { primary: "electrical_engineer", reason: "System design and safety are electrical domain." }
  },
  {
    key: "cctv-installation",
    name: "CCTV installation",
    marketNames: ["cctv installer"],
    pricingBasis: "either",
    pricingUnits: ["job", "point"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "camera_count", "cable_runs", "height_access", "remote_viewing_setup", "testing_commissioning"],
    reviewers: { primary: "security_low_voltage", reason: "Low-voltage system scope." }
  },
  {
    key: "inverter-installation",
    name: "Inverter installation",
    marketNames: ["inverter installer"],
    pricingBasis: "either",
    pricingUnits: ["job"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "capacity_kva", "battery_bank_size", "changeover_wiring", "load_separation", "testing_commissioning"],
    reviewers: { primary: "electrical_engineer", reason: "Load separation and changeover safety are electrical." }
  },
  {
    key: "ac-installation",
    name: "Air-conditioner installation",
    marketNames: ["ac installer"],
    pricingBasis: "either",
    pricingUnits: ["piece"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "unit_type_split_window", "piping_distance", "wall_drilling", "bracket", "gas_topup"],
    reviewers: { primary: "building_services", reason: "Refrigeration piping scope is mechanical." }
  },
  {
    key: "drainage-construction",
    name: "Drainage construction",
    marketNames: ["drainage work", "gutter construction"],
    pricingBasis: "either",
    pricingUnits: ["linear_metre", "job"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "drain_size_profile", "excavation_depth", "blockwork_vs_cast", "covers_included", "disposal"],
    reviewers: { primary: "structural_engineer", secondary: "quantity_surveyor", reason: "Drainage sections and reinforcement are structural." }
  },
  {
    key: "borehole-drilling",
    name: "Borehole drilling",
    marketNames: ["borehole man", "drilling"],
    pricingBasis: "either",
    pricingUnits: ["job"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "depth_expected", "terrain_geology", "casing_type", "pump_included", "tank_stand_included", "water_treatment_included", "geophysical_survey"],
    reviewers: { primary: "building_services", reason: "Drilling scope and casing specs are services/geotechnical domain." },
    notes: "Extreme regional variance (depth/geology). Never compare across terrain classes."
  },
  {
    key: "waterproofing-application",
    name: "Waterproofing application",
    marketNames: ["waterproofing work"],
    pricingBasis: "either",
    pricingUnits: ["sqm"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "system_type", "surface_condition", "coats_layers", "warranty"],
    reviewers: { primary: "building_services", reason: "Application standards are services domain." }
  },
  {
    key: "german-floor-installation",
    name: "German-floor installation",
    marketNames: ["german floor work", "interlocking laying"],
    pricingBasis: "either",
    pricingUnits: ["sqm"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "sub_base_preparation", "paver_vs_cast", "thickness", "compaction_equipment"],
    reviewers: { primary: "quantity_surveyor", reason: "m\xB2 rate build-up with material/labour split." }
  },
  {
    key: "kitchen-fabrication-installation",
    name: "Kitchen-cabinet fabrication & installation",
    marketNames: ["kitchen carpenter", "cabinet maker"],
    pricingBasis: "labour_and_material",
    pricingUnits: ["linear_metre", "job"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "carcass_material", "door_finish", "worktop_material", "hardware_grade", "design_complexity"],
    reviewers: { primary: "architect_interior", secondary: "quantity_surveyor", reason: "Interior fabrication specification." }
  },
  {
    key: "equipment-rental",
    name: "Scaffolding / equipment rental",
    marketNames: ["scaffold hire", "equipment hire"],
    pricingBasis: "labour_only",
    pricingUnits: ["day", "job"],
    hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, "equipment_type", "rental_duration", "operator_included", "delivery_return", "deposit_required"],
    reviewers: { primary: "quantity_surveyor", reason: "Rental rate conventions are QS domain." },
    notes: "Rental pricing \u2014 never mixes with purchase observations."
  }
];
var SERVICE_INDEX = new Map(SERVICE_FAMILIES.map((s) => [s.key, s]));

// prisma/seeds/price-intelligence.seed.ts
var PRICE_TAXONOMY_SEED_VERSION = "1";
var CATEGORIES = [
  { code: "structural", name: "Structural", sortOrder: 1 },
  { code: "envelope", name: "Envelope & Roofing", sortOrder: 2 },
  { code: "finishes", name: "Finishes", sortOrder: 3 },
  { code: "mep", name: "MEP (Mechanical / Electrical / Plumbing)", sortOrder: 4 },
  { code: "energy", name: "Energy & Power", sortOrder: 5 },
  { code: "security", name: "Security", sortOrder: 6 }
];
var SOURCE_TIERS = {
  "manufacturer-distributor-sites": 1,
  "jumia-nigeria": 2,
  "jiji-ng": 3,
  konga: 2,
  "facebook-marketplace-social-pages": 4,
  "merchant-whatsapp-price-lists": 2,
  "google-business-profiles": 4
};
function slugify(name) {
  return name.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").split("-").slice(0, 5).join("-");
}
function normalizeAlias(alias) {
  return alias.trim().toLowerCase().replace(/\s+/g, " ");
}
async function seedPriceIntelligence(prisma) {
  for (const c of CATEGORIES) {
    await prisma.priceCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, sortOrder: c.sortOrder, deletedAt: null },
      create: c
    });
  }
  for (const u of UNITS) {
    await prisma.priceUnit.upsert({
      where: { code: u.code },
      update: { label: u.label, dimension: u.dimension, aliases: [...u.aliases], deletedAt: null },
      create: { code: u.code, label: u.label, dimension: u.dimension, aliases: [...u.aliases] }
    });
  }
  for (const r of CONVERSION_RULES) {
    const where = {
      fromUnitCode_toUnitCode_factorSource: {
        fromUnitCode: r.fromUnit,
        toUnitCode: r.toUnit,
        factorSource: r.factorSource
      }
    };
    const data = {
      fixedFactor: r.fixedFactor ?? null,
      requiredInput: r.requiredInput,
      note: r.note ?? null,
      deletedAt: null
    };
    await prisma.priceConversionRule.upsert({
      where,
      update: data,
      create: {
        fromUnitCode: r.fromUnit,
        toUnitCode: r.toUnit,
        factorSource: r.factorSource,
        ...data
      }
    });
  }
  for (const loc of LOCATIONS) {
    await prisma.priceLocation.upsert({
      where: { code: loc.key },
      update: {
        name: loc.label,
        type: loc.type,
        launchPriority: loc.launchPriority ?? false,
        deletedAt: null
      },
      create: {
        code: loc.key,
        name: loc.label,
        type: loc.type,
        launchPriority: loc.launchPriority ?? false
      }
    });
  }
  for (const loc of LOCATIONS) {
    if (!loc.parentKey) continue;
    const parent = await prisma.priceLocation.findUnique({ where: { code: loc.parentKey } });
    if (!parent) throw new Error(`Seed integrity error: parent location '${loc.parentKey}' missing for '${loc.key}'`);
    await prisma.priceLocation.update({ where: { code: loc.key }, data: { parentId: parent.id } });
  }
  for (const s of SOURCE_ACCESS_REGISTER) {
    const code = slugify(s.sourceName);
    await prisma.priceSource.upsert({
      where: { code },
      update: { name: s.sourceName, accessStatus: s.accessStatus, accessNote: s.note, tier: SOURCE_TIERS[code] ?? 4, deletedAt: null },
      create: { code, name: s.sourceName, accessStatus: s.accessStatus, accessNote: s.note, tier: SOURCE_TIERS[code] ?? 4 }
    });
  }
  const brandNames = /* @__PURE__ */ new Set();
  for (const family of LEVEL1_FAMILIES) {
    const category = await prisma.priceCategory.findUnique({ where: { code: family.parentCategory } });
    if (!category) throw new Error(`Seed integrity error: category '${family.parentCategory}' missing`);
    const definition = {
      attributes: family.attributes,
      questions: family.questions,
      matching: family.matching,
      inclusionChecks: family.inclusionChecks,
      riskFlags: family.riskFlags,
      normalizedUnitRationale: family.normalizedUnitRationale
    };
    const familyData = {
      name: family.name,
      categoryId: category.id,
      kind: family.kind,
      funnelRole: family.funnelRole,
      normalizedUnitCode: family.normalizedUnit,
      normalizedUnitRationale: family.normalizedUnitRationale,
      sellerUnitCodes: [...family.sellerUnits],
      applicableConditions: [...family.applicableConditions],
      definition,
      definitionSchemaVersion: 1,
      escalationPrimary: family.reviewers.primary,
      escalationSecondary: family.reviewers.secondary ?? null,
      escalationReason: family.reviewers.reason,
      deletedAt: null
    };
    const dbFamily = await prisma.priceProductFamily.upsert({
      where: { key: family.key },
      update: familyData,
      // note: does NOT bump `version` — admin edits do that
      create: { key: family.key, ...familyData }
    });
    for (const sub of family.subProducts) {
      await prisma.priceProduct.upsert({
        where: { familyId_key: { familyId: dbFamily.id, key: sub.key } },
        update: { name: sub.label, deletedAt: null },
        create: { familyId: dbFamily.id, key: sub.key, name: sub.label }
      });
      for (const alias of sub.aliases ?? []) {
        const product = await prisma.priceProduct.findUnique({
          where: { familyId_key: { familyId: dbFamily.id, key: sub.key } }
        });
        await prisma.priceAlias.upsert({
          where: { familyId_normalizedAlias: { familyId: dbFamily.id, normalizedAlias: normalizeAlias(alias) } },
          update: { alias, productId: product?.id ?? null, deletedAt: null },
          create: {
            familyId: dbFamily.id,
            productId: product?.id ?? null,
            alias,
            normalizedAlias: normalizeAlias(alias),
            source: "stage2_taxonomy"
          }
        });
      }
    }
    for (const alias of family.marketNames) {
      await prisma.priceAlias.upsert({
        where: { familyId_normalizedAlias: { familyId: dbFamily.id, normalizedAlias: normalizeAlias(alias) } },
        update: { alias, deletedAt: null },
        create: { familyId: dbFamily.id, alias, normalizedAlias: normalizeAlias(alias), source: "stage2_taxonomy" }
      });
    }
    for (const attr of family.attributes) {
      await prisma.priceSpecificationDefinition.upsert({
        where: { familyId_key: { familyId: dbFamily.id, key: attr.key } },
        update: {
          label: attr.label,
          priceChanging: attr.priceChanging,
          allowedValues: attr.values ? [...attr.values] : void 0,
          deletedAt: null
        },
        create: {
          familyId: dbFamily.id,
          key: attr.key,
          label: attr.label,
          priceChanging: attr.priceChanging,
          allowedValues: attr.values ? [...attr.values] : void 0
        }
      });
      if (attr.key === "brand" && attr.values) {
        for (const v of attr.values) brandNames.add(v);
      }
    }
  }
  for (const name of brandNames) {
    const normalizedName = normalizeAlias(name);
    if (normalizedName === "other" || normalizedName === "unknown") continue;
    await prisma.priceBrand.upsert({
      where: { normalizedName },
      update: { name, deletedAt: null },
      create: { name, normalizedName }
    });
  }
  for (const svc of SERVICE_FAMILIES) {
    const definition = {
      marketNames: svc.marketNames,
      pricingUnits: svc.pricingUnits,
      hasMinimumJobCharge: svc.hasMinimumJobCharge,
      scopeFactors: svc.scopeFactors,
      notes: svc.notes ?? null
    };
    await prisma.priceServiceFamily.upsert({
      where: { key: svc.key },
      update: {
        name: svc.name,
        pricingBasis: svc.pricingBasis,
        definition,
        escalationPrimary: svc.reviewers.primary,
        escalationSecondary: svc.reviewers.secondary ?? null,
        escalationReason: svc.reviewers.reason,
        deletedAt: null
      },
      create: {
        key: svc.key,
        name: svc.name,
        pricingBasis: svc.pricingBasis,
        definition,
        escalationPrimary: svc.reviewers.primary,
        escalationSecondary: svc.reviewers.secondary ?? null,
        escalationReason: svc.reviewers.reason
      }
    });
  }
  await prisma.priceSeedMeta.upsert({
    where: { key: "taxonomy_seed_version" },
    update: { value: PRICE_TAXONOMY_SEED_VERSION, appliedAt: /* @__PURE__ */ new Date() },
    create: { key: "taxonomy_seed_version", value: PRICE_TAXONOMY_SEED_VERSION }
  });
}
if (require.main === module) {
  const prisma = new import_client.PrismaClient();
  seedPriceIntelligence(prisma).then(async () => {
    const counts = {
      categories: await prisma.priceCategory.count(),
      families: await prisma.priceProductFamily.count(),
      products: await prisma.priceProduct.count(),
      aliases: await prisma.priceAlias.count(),
      specDefs: await prisma.priceSpecificationDefinition.count(),
      brands: await prisma.priceBrand.count(),
      units: await prisma.priceUnit.count(),
      conversionRules: await prisma.priceConversionRule.count(),
      locations: await prisma.priceLocation.count(),
      sources: await prisma.priceSource.count(),
      serviceFamilies: await prisma.priceServiceFamily.count()
    };
    console.log("\u2705 Price intelligence seed complete:", counts);
    await prisma.$disconnect();
  }).catch(async (err) => {
    console.error("\u274C Price intelligence seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PRICE_TAXONOMY_SEED_VERSION,
  seedPriceIntelligence
});

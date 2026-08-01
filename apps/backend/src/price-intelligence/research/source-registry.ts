/**
 * Stage 4 section 11 — revised source registry.
 *
 * NOT merely a list of sites to scrape. Each source carries an access policy
 * that governs, per-source, whether it may be used for search DISCOVERY,
 * direct FETCH, or BROWSER fallback. A source can be discovery-eligible even
 * when automated extraction is not permitted. Access decisions are
 * source-specific: Jiji, Jumia, Konga, Facebook etc. are NOT treated
 * identically.
 *
 * Runtime metrics (extraction success, acceptance rate, freshness, latency,
 * cost) are updated from research runs and persisted in the PriceSource table;
 * this file holds the static policy seed + deterministic access helpers.
 */

export type SourceType =
  | 'manufacturer'
  | 'authorised_distributor'
  | 'established_ecommerce'
  | 'classified_marketplace'
  | 'social_marketplace'
  | 'merchant_direct'
  | 'directory'
  | 'other';

export interface SourcePolicy {
  name: string;
  domain: string;
  sourceType: SourceType;
  confidenceTier: 1 | 2 | 3 | 4;
  countryCoverage: string[];
  productCategories: string[]; // 'all' allowed
  publicAccess: boolean;
  searchDiscoveryEligible: boolean;
  directFetchEligible: boolean;
  browserFallbackEligible: boolean;
  apiOrFeedAvailable: boolean;
  permissionRequired: boolean;
  rateLimitPolicy: string;
  robotsNotes: string;
  termsReviewStatus: 'pending' | 'reviewed_ok' | 'reviewed_restricted' | 'prohibited';
  lastPolicyReviewDate: string; // ISO date
  enabled: boolean;
  adminNotes: string;
}

/**
 * Seed policy. Access flags follow the Stage 2 ethics register:
 *  - classified/marketplace pages: discovery + careful public fetch, no login/CAPTCHA bypass;
 *  - Konga & Facebook: discovery only (automated extraction prohibited/ login-gated);
 *  - manufacturer/distributor: preferred; fetch eligible.
 * Domains matched by suffix; unknown domains get a conservative default.
 */
export const SOURCE_POLICIES: readonly SourcePolicy[] = [
  {
    name: 'Manufacturer / distributor sites',
    domain: '*manufacturer*',
    sourceType: 'manufacturer',
    confidenceTier: 1,
    countryCoverage: ['NG'],
    productCategories: ['all'],
    publicAccess: true,
    searchDiscoveryEligible: true,
    directFetchEligible: true,
    browserFallbackEligible: true,
    apiOrFeedAvailable: false,
    permissionRequired: false,
    rateLimitPolicy: 'polite: <=1 req/2s per host',
    robotsNotes: 'Respect robots.txt; price lists rarely public.',
    termsReviewStatus: 'reviewed_ok',
    lastPolicyReviewDate: '2026-07-30',
    enabled: true,
    adminNotes: 'Preferred evidence. Distributor confirmation strongest.',
  },
  {
    name: 'Jumia Nigeria',
    domain: 'jumia.com.ng',
    sourceType: 'established_ecommerce',
    confidenceTier: 2,
    countryCoverage: ['NG'],
    productCategories: ['all'],
    publicAccess: true,
    searchDiscoveryEligible: true,
    directFetchEligible: true,
    browserFallbackEligible: false,
    apiOrFeedAvailable: false,
    permissionRequired: false,
    rateLimitPolicy: 'polite: <=1 req/3s per host',
    robotsNotes: 'Product pages carry JSON-LD. Respect robots + rate limits; re-verify ToS.',
    termsReviewStatus: 'reviewed_ok',
    lastPolicyReviewDate: '2026-07-30',
    enabled: true,
    adminNotes: 'Structured data usually present.',
  },
  {
    name: 'Jiji.ng',
    domain: 'jiji.ng',
    sourceType: 'classified_marketplace',
    confidenceTier: 3,
    countryCoverage: ['NG'],
    productCategories: ['all'],
    publicAccess: true,
    searchDiscoveryEligible: true,
    directFetchEligible: true,
    browserFallbackEligible: false,
    apiOrFeedAvailable: false,
    permissionRequired: false,
    rateLimitPolicy: 'polite: <=1 req/3s per host',
    robotsNotes: 'Classified asking prices (Tier 3). Treat as negotiable. No login bypass.',
    termsReviewStatus: 'reviewed_ok',
    lastPolicyReviewDate: '2026-07-30',
    enabled: true,
    adminNotes: 'High coverage for NG building materials; asking prices, not transactions.',
  },
  {
    name: 'Konga',
    domain: 'konga.com',
    sourceType: 'established_ecommerce',
    confidenceTier: 2,
    countryCoverage: ['NG'],
    productCategories: ['all'],
    publicAccess: true,
    searchDiscoveryEligible: true,
    directFetchEligible: false,
    browserFallbackEligible: false,
    apiOrFeedAvailable: false,
    permissionRequired: true,
    rateLimitPolicy: 'n/a — no automated fetch',
    robotsNotes: 'Automated extraction prohibited per Stage 2. Discovery only.',
    termsReviewStatus: 'reviewed_restricted',
    lastPolicyReviewDate: '2026-07-30',
    enabled: true,
    adminNotes: 'Use as a discovery signal only unless a partnership exists.',
  },
  {
    name: 'Facebook Marketplace / social pages',
    domain: 'facebook.com',
    sourceType: 'social_marketplace',
    confidenceTier: 4,
    countryCoverage: ['NG'],
    productCategories: ['all'],
    publicAccess: false,
    searchDiscoveryEligible: false,
    directFetchEligible: false,
    browserFallbackEligible: false,
    apiOrFeedAvailable: false,
    permissionRequired: true,
    rateLimitPolicy: 'n/a — login-gated',
    robotsNotes: 'Login-gated; no automation. Manual permission-based only.',
    termsReviewStatus: 'prohibited',
    lastPolicyReviewDate: '2026-07-30',
    enabled: false,
    adminNotes: 'Excluded from the automated pipeline.',
  },
];

const DEFAULT_POLICY: SourcePolicy = {
  name: 'Unknown public source',
  domain: '*',
  sourceType: 'other',
  confidenceTier: 4,
  countryCoverage: ['NG'],
  productCategories: ['all'],
  publicAccess: true,
  searchDiscoveryEligible: true,
  directFetchEligible: true, // still subject to robots + SSRF + policy at fetch time
  browserFallbackEligible: false,
  apiOrFeedAvailable: false,
  permissionRequired: false,
  rateLimitPolicy: 'polite: <=1 req/3s per host',
  robotsNotes: 'Unknown source — conservative defaults; respect robots.',
  termsReviewStatus: 'pending',
  lastPolicyReviewDate: '2026-07-30',
  enabled: true,
  adminNotes: 'Auto-classified; review before elevating tier.',
};

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

/** Find the policy for a URL by domain suffix; falls back to conservative default. */
export function policyForUrl(url: string): SourcePolicy {
  const host = domainOf(url);
  if (!host) return { ...DEFAULT_POLICY, enabled: false, adminNotes: 'Unparseable URL' };
  const match = SOURCE_POLICIES.find(
    (p) => p.domain !== '*' && !p.domain.includes('*') && (host === p.domain || host.endsWith('.' + p.domain)),
  );
  return match ?? DEFAULT_POLICY;
}

export type AccessDecision = {
  allowed: boolean;
  reason: string;
};

export function canDiscover(url: string): AccessDecision {
  const p = policyForUrl(url);
  if (!p.enabled) return { allowed: false, reason: `${p.name}: source disabled` };
  if (!p.searchDiscoveryEligible) return { allowed: false, reason: `${p.name}: not discovery-eligible` };
  return { allowed: true, reason: p.name };
}

export function canDirectFetch(url: string): AccessDecision {
  const p = policyForUrl(url);
  if (!p.enabled) return { allowed: false, reason: `${p.name}: source disabled` };
  if (!p.publicAccess) return { allowed: false, reason: `${p.name}: not public` };
  if (!p.directFetchEligible) return { allowed: false, reason: `${p.name}: direct fetch not permitted (discovery only)` };
  if (p.permissionRequired) return { allowed: false, reason: `${p.name}: permission required` };
  return { allowed: true, reason: p.name };
}

export function canBrowserFallback(url: string): AccessDecision {
  const p = policyForUrl(url);
  if (!p.enabled) return { allowed: false, reason: `${p.name}: source disabled` };
  if (!p.browserFallbackEligible) return { allowed: false, reason: `${p.name}: browser fallback not permitted` };
  return { allowed: true, reason: p.name };
}

import { computeArtisanTrust, type ArtisanTrustSuggestion } from '../artisans/artisan-trust';

export type JoinChecklistItem = { key: string; label: string };

const PROOF_LABELS: Record<string, string> = {
  council: 'Council registration',
  cac: 'CAC registration',
  id: 'Government ID',
  reference: 'Someone who can vouch for your work',
  address: 'Proof of where you work',
  shopPhoto: 'A photo of your shop',
};

/**
 * Staff convert a join request by hand. Do not auto-create listings.
 * Proof key -> existing records:
 * cac -> artisan business_registration_checked / GC cac_certificate / vendor cac_certificate
 * id -> artisan identity_checked / GC government_id / vendor government_id
 * reference -> artisan references_checked
 * address -> artisan work_base_checked / GC proof_of_business_address / vendor proof_of_address
 * council -> artisan trade_evidence_checked / GC professional_license / ProfessionalCredential
 * shopPhoto -> vendor storefront_photo
 */
export function buildJoinChecklist(
  path: string,
  answers: Record<string, unknown>,
): JoinChecklistItem[] {
  if (path === 'repairs' || path === 'cleaning') {
    const trust = computeArtisanTrust({
      displayName: 'Lead',
      hasTrade: true,
      phone: '+2348000000000',
      whatsapp: '+2348000000000',
      state: typeof answers.state === 'string' ? answers.state : null,
      city: typeof answers.area === 'string' ? answers.area : null,
      serviceAreaCount: Array.isArray(answers.area) ? answers.area.length : answers.area ? 1 : 0,
      hasLogo: false,
      hasWorkshopCover: false,
      galleryCount: 0,
      specialtyCount: 0,
      serviceCount: 1,
      problemCount: 0,
      claimed: false,
      verificationSubmitted: false,
      verificationCheckPassed: false,
      verificationApproved: false,
    });
    return trust.suggestions
      .filter((item: ArtisanTrustSuggestion) => !['claimed', 'website', 'email'].includes(item.key))
      .slice(0, 5)
      .map((item) => ({ key: item.key, label: item.label }));
  }

  const proofs = (answers.proofs && typeof answers.proofs === 'object' ? answers.proofs : {}) as Record<string, string>;
  const rows: JoinChecklistItem[] = [];
  for (const [key, label] of Object.entries(PROOF_LABELS)) {
    if (proofs[key] === 'not_have' || proofs[key] == null) {
      rows.push({ key, label: `Add ${label} when you can` });
    }
  }
  if (answers.photos !== 'will_send') {
    rows.push({ key: 'photos', label: 'Send photos of your work on WhatsApp' });
  }
  return rows.slice(0, 5);
}

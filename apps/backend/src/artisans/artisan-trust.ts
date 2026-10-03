export type ArtisanTrustInput = {
  displayName?: string | null;
  businessName?: string | null;
  hasTrade: boolean;
  bio?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  serviceAreaCount: number;
  hasLogo: boolean;
  hasWorkshopCover: boolean;
  galleryCount: number;
  specialtyCount: number;
  serviceCount: number;
  problemCount: number;
  claimed: boolean;
  verificationSubmitted: boolean;
  verificationCheckPassed: boolean;
  verificationApproved: boolean;
};

export type ArtisanTrustSuggestion = {
  key: string;
  label: string;
  points: number;
};

const GALLERY_POINTS = [0, 2, 3, 5];

function galleryPoints(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return GALLERY_POINTS[1];
  if (count === 2) return GALLERY_POINTS[2];
  return GALLERY_POINTS[3];
}

/**
 * Deterministic 0–100 profile information score.
 * It is not verification and it does not hide a listing.
 *
 * Identity 15, contact 15, location 15, media 20, repair capability 15, claim 5, verification 15.
 */
export function computeArtisanTrust(input: ArtisanTrustInput): { score: number; suggestions: ArtisanTrustSuggestion[] } {
  // An unchecked submission does not change the score. The field stays so existing callers compile.
  void input.verificationSubmitted;
  const parts: Array<{ key: string; label: string; earned: number; max: number }> = [
    { key: 'name', label: 'Add the artisan or business name', earned: input.displayName || input.businessName ? 6 : 0, max: 6 },
    { key: 'trade', label: 'Choose a primary trade', earned: input.hasTrade ? 5 : 0, max: 5 },
    { key: 'bio', label: 'Add a short description of the work', earned: (input.bio || '').trim().length >= 40 ? 4 : 0, max: 4 },
    { key: 'phone', label: 'Add a phone number', earned: input.phone ? 5 : 0, max: 5 },
    { key: 'whatsapp', label: 'Add a WhatsApp number', earned: input.whatsapp ? 4 : 0, max: 4 },
    { key: 'email', label: 'Add an email address', earned: input.email ? 3 : 0, max: 3 },
    { key: 'website', label: 'Add a website', earned: input.website ? 3 : 0, max: 3 },
    { key: 'state', label: 'Add the state', earned: input.state ? 4 : 0, max: 4 },
    { key: 'city', label: 'Add the city or town', earned: input.city ? 4 : 0, max: 4 },
    { key: 'address', label: 'Add the workshop or work-base address', earned: input.address ? 4 : 0, max: 4 },
    { key: 'serviceArea', label: 'Add the areas you serve', earned: input.serviceAreaCount > 0 ? 3 : 0, max: 3 },
    { key: 'logo', label: 'Upload your logo', earned: input.hasLogo ? 5 : 0, max: 5 },
    { key: 'workshopCover', label: 'Upload a clear photo of the front of your workshop or regular work base', earned: input.hasWorkshopCover ? 10 : 0, max: 10 },
    { key: 'gallery', label: 'Add at least three photos of completed work', earned: galleryPoints(input.galleryCount), max: 5 },
    { key: 'specialty', label: 'Add a specialty', earned: input.specialtyCount > 0 ? 5 : 0, max: 5 },
    { key: 'service', label: 'Add the repair services you offer', earned: input.serviceCount > 0 ? 6 : 0, max: 6 },
    { key: 'problem', label: 'Add the problems you fix', earned: input.problemCount > 0 ? 4 : 0, max: 4 },
    { key: 'claimed', label: 'Claim this listing', earned: input.claimed ? 5 : 0, max: 5 },
    // verificationSubmitted is kept on the input for callers, but an unchecked submission earns nothing.
    { key: 'verificationCheck', label: 'Send us proof so BuildMyHouse can check it', earned: input.verificationCheckPassed ? 10 : 0, max: 10 },
    { key: 'verificationApproved', label: 'Earn a BuildMyHouse check over time', earned: input.verificationApproved ? 5 : 0, max: 5 },
  ];

  const score = parts.reduce((sum, part) => sum + part.earned, 0);
  const suggestions = parts
    .filter((part) => part.earned < part.max)
    .map((part) => ({ key: part.key, label: part.label, points: part.max - part.earned }));

  return { score, suggestions };
}

export const ARTISAN_TRUST_EXPLANATION =
  'This percentage reflects how much useful profile and trust information has been provided, such as photos, contact details, service information and verification evidence. It is not a guarantee of workmanship.';

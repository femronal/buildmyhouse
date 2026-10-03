export type GCVerificationDocumentType =
  | 'cac_certificate'
  | 'tin_certificate'
  | 'tax_clearance_certificate'
  | 'professional_license'
  | 'government_id'
  | 'proof_of_business_address'
  | 'insurance_certificate'
  | 'means_of_identification_of_director';

export type GCVerificationDocumentDefinition = {
  type: GCVerificationDocumentType;
  title: string;
  description: string;
};

export const GC_VERIFICATION_REQUIRED_DOCUMENTS: GCVerificationDocumentDefinition[] = [
  {
    type: 'cac_certificate',
    title: 'CAC Registration Certificate',
    description: 'Corporate Affairs Commission certificate (or BN/RC registration evidence).',
  },
  {
    type: 'tin_certificate',
    title: 'Tax Identification Number (TIN)',
    description: 'FIRS-issued TIN record for the company or registered business.',
  },
  {
    type: 'tax_clearance_certificate',
    title: 'Tax Clearance Certificate',
    description: 'Recent tax clearance from relevant tax authority.',
  },
  {
    type: 'professional_license',
    title: 'Professional License / Council Registration',
    description: 'Valid registration (e.g. CORBON/COREN/NIOB or equivalent).',
  },
  {
    type: 'government_id',
    title: 'Government-Issued ID',
    description: 'NIN slip/card, International Passport, Driver’s License, or Voter’s Card.',
  },
  {
    type: 'proof_of_business_address',
    title: 'Proof of Business Address',
    description: 'Utility bill, tenancy agreement, or other address proof.',
  },
  {
    type: 'insurance_certificate',
    title: 'Insurance Certificate',
    description: 'Contractors-all-risk or public liability insurance cover.',
  },
  {
    type: 'means_of_identification_of_director',
    title: 'Director/Proprietor ID',
    description: 'Valid ID for key signatory/director linked to the business.',
  },
];

/** Legacy name. None of these documents is required to join BuildMyHouse. */
export type ProofAnswerValue = 'added' | 'not_have' | 'not_applicable';
export type ProofReviewValue = 'unchecked' | 'passed' | 'failed';
export type DerivedProofStatus =
  | 'checked'
  | 'did_not_pass'
  | 'received'
  | 'says_has'
  | 'not_have'
  | 'not_applicable'
  | 'not_answered';

export function deriveProofStatus(input: {
  answer?: ProofAnswerValue | null;
  hasFile?: boolean;
  reviewStatus?: ProofReviewValue | null;
}): DerivedProofStatus {
  if (input.reviewStatus === 'passed') return 'checked';
  if (input.reviewStatus === 'failed') return 'did_not_pass';
  if (input.hasFile) return 'received';
  if (input.answer === 'added') return 'says_has';
  if (input.answer === 'not_have') return 'not_have';
  if (input.answer === 'not_applicable') return 'not_applicable';
  return 'not_answered';
}

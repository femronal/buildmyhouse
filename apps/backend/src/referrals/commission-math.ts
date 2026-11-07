/** Monitoring 5% plus coordination 5%. Contingency is never part of this. */
export const CONTROLLING_FEE_RATE = 0.1;
export const MONITORING_RATE = 0.05;
export const COORDINATION_RATE = 0.05;
export const CONTINGENCY_RATE = 0.2;
export const DEFAULT_AFFILIATE_RATE_BPS = 250;
export const FOUNDING_AGREEMENT_VERSION = 'founding-affiliates-2026-11';
export const DISCLOSURE =
  'I may earn a commission if you complete a project with BuildMyHouse after using my link.';

export type CommissionFacts = {
  contractorAmount: number;
  monitoringFee?: number | null;
  coordinationFee?: number | null;
  contingencyFee?: number | null;
  confirmedPayments: number;
  rateBps?: number | null;
  fixedNaira?: number | null;
  projectCompleted: boolean;
  agreementActive: boolean;
  selfReferral: boolean;
  contractorConflict: boolean;
};

export type CommissionDecision = {
  action: 'skip' | 'record';
  status: 'awaiting_checks' | 'needs_review';
  eligibleContractorAmount: number;
  controllingFeeAmount: number;
  contingencyAmount: number;
  amount: number;
  rateBps: number;
  reasons: string[];
};

export function money(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function explicitFee(value: number | null | undefined, fallback: number) {
  if (value == null || !Number.isFinite(Number(value))) return money(fallback);
  return money(Math.max(0, Number(value)));
}

/**
 * Commission is  rateBps of the contractor amount, funded only by the controlling fee.
 * A ₦50,000,000 contractor amount at 250 bps is ₦1,250,000.
 * Contingency (20%) is recorded and then ignored.
 */
export function decideCommission(facts: CommissionFacts): CommissionDecision {
  const contractorAmount = money(Math.max(0, Number(facts.contractorAmount) || 0));
  const monitoring = explicitFee(facts.monitoringFee, contractorAmount * MONITORING_RATE);
  const coordination = explicitFee(facts.coordinationFee, contractorAmount * COORDINATION_RATE);
  const contingency = explicitFee(facts.contingencyFee, contractorAmount * CONTINGENCY_RATE);
  const controllingFee = money(monitoring + coordination);
  const rateBps = Math.max(0, Math.round(Number(facts.rateBps) || 0));
  const percentAmount = money((contractorAmount * rateBps) / 10000);
  const fixed = facts.fixedNaira == null ? null : money(Math.max(0, Number(facts.fixedNaira) || 0));
  const raw = fixed != null ? fixed : percentAmount;
  const amount = money(Math.min(raw, controllingFee));

  const reasons: string[] = [];
  if (!facts.agreementActive) reasons.push('No active affiliate agreement.');
  if (contractorAmount <= 0) reasons.push('There is no accepted contractor amount.');
  if (!facts.projectCompleted) reasons.push('The project is not completed through stage approval.');
  const required = money(contractorAmount + controllingFee);
  if (money(facts.confirmedPayments) + 0.5 < required) {
    reasons.push('Confirmed payments do not cover the contractor amount and the controlling fee.');
  }
  if (amount <= 0) reasons.push('The controlling fee does not fund a commission.');
  if (facts.selfReferral) reasons.push('The homeowner is the affiliate.');
  if (facts.contractorConflict) reasons.push('The affiliate is the contractor on this project.');

  const reviewOnly = new Set([
    'The homeowner is the affiliate.',
    'The affiliate is the contractor on this project.',
  ]);
  const blockers = reasons.filter((reason) => !reviewOnly.has(reason));
  if (blockers.length) {
    return {
      action: 'skip',
      status: 'awaiting_checks',
      eligibleContractorAmount: contractorAmount,
      controllingFeeAmount: controllingFee,
      contingencyAmount: contingency,
      amount,
      rateBps,
      reasons,
    };
  }

  return {
    action: 'record',
    status: facts.selfReferral || facts.contractorConflict ? 'needs_review' : 'awaiting_checks',
    eligibleContractorAmount: contractorAmount,
    controllingFeeAmount: controllingFee,
    contingencyAmount: contingency,
    amount,
    rateBps,
    reasons: facts.selfReferral || facts.contractorConflict ? reasons : ['Contingency is excluded from this commission.'],
  };
}

export function commissionExample(contractorAmount = 50_000_000, rateBps = DEFAULT_AFFILIATE_RATE_BPS) {
  const decision = decideCommission({
    contractorAmount,
    confirmedPayments: contractorAmount + contractorAmount * CONTROLLING_FEE_RATE,
    rateBps,
    projectCompleted: true,
    agreementActive: true,
    selfReferral: false,
    contractorConflict: false,
  });
  return {
    contractorAmount: decision.eligibleContractorAmount,
    contingencyAmount: decision.contingencyAmount,
    controllingFeeAmount: decision.controllingFeeAmount,
    commission: decision.amount,
    bmhRetainedControllingFee: money(decision.controllingFeeAmount - decision.amount),
    rateBps,
  };
}

export function maskHomeownerName(fullName?: string | null) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'Homeowner';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1).toUpperCase()}.`;
}

export function pipelineStage(statuses: string[]) {
  if (statuses.some((status) => status === 'completed')) return 'completed';
  if (statuses.some((status) => status === 'active' || status === 'paused')) return 'in_progress';
  if (statuses.some((status) => status === 'draft')) return 'enquiry';
  return 'registered';
}

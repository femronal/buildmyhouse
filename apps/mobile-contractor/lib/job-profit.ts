type StagePrice = {
  status?: string | null;
  estimatedCost?: number | null;
};

function started(status?: string | null) {
  const value = String(status || '').trim().toLowerCase();
  return value !== '' && value !== 'not_started';
}

export function paymentChoiceLabel(model?: string | null) {
  if (model === 'pay_in_full') return 'Project paid in full';
  if (model === 'pay_by_stage') return 'Project paid stage by stage';
  return 'Payment choice not set';
}

export function startedStagePrice(stages?: StagePrice[] | null) {
  return (stages || []).reduce((sum, stage) => {
    if (!started(stage?.status)) return sum;
    return sum + (Number(stage?.estimatedCost) || 0);
  }, 0);
}

export function fundedJobPrice(input: {
  paymentModel?: string | null;
  fullJobPrice?: number | null;
  stages?: StagePrice[] | null;
}) {
  const full = Number(input.fullJobPrice) || 0;
  if (input.paymentModel !== 'pay_by_stage') return Math.round(full * 100) / 100;
  return Math.round(startedStagePrice(input.stages) * 100) / 100;
}

export function contractorProfit(input: {
  paymentModel?: string | null;
  fullJobPrice?: number | null;
  stages?: StagePrice[] | null;
  paidToShops?: number | null;
  paidToTeam?: number | null;
}) {
  const shops = Number(input.paidToShops) || 0;
  const team = Number(input.paidToTeam) || 0;
  return Math.max(0, Math.round((fundedJobPrice(input) - shops - team) * 100) / 100);
}

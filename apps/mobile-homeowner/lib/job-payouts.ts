type PayoutLine = {
  payeeKind?: string | null;
  status?: string | null;
  totalPrice?: number | null;
  quantity?: number | null;
  unitPrice?: number | null;
};

type PayoutStage = {
  materials?: PayoutLine[] | null;
  teamMembers?: Array<{
    payStatus?: string | null;
    paidBy?: string | null;
    paidAmount?: number | null;
    dailyRate?: number | null;
  }> | null;
};

function lineAmount(line: PayoutLine): number {
  const total = Number(line.totalPrice);
  if (Number.isFinite(total) && total > 0) return total;
  const quantity = Number(line.quantity);
  const unitPrice = Number(line.unitPrice);
  if (Number.isFinite(quantity) && Number.isFinite(unitPrice) && quantity * unitPrice > 0) {
    return quantity * unitPrice;
  }
  return 0;
}

export function paidPayoutsFromStages(stages?: PayoutStage[] | null): { artisan: number; shop: number; team: number } {
  let artisan = 0;
  let shop = 0;
  let team = 0;
  for (const stage of stages || []) {
    for (const line of stage?.materials || []) {
      if (String(line?.status || '').trim().toLowerCase() !== 'paid') continue;
      const amount = lineAmount(line);
      const kind = String(line?.payeeKind || '').trim().toLowerCase();
      if (kind === 'artisan') artisan += amount;
      else if (kind === 'shop') shop += amount;
    }
    for (const member of stage?.teamMembers || []) {
      if (String(member?.payStatus || '').trim().toLowerCase() !== 'paid') continue;
      if (String(member?.paidBy || '').trim().toLowerCase() !== 'bmh') continue;
      const paid = Number(member.paidAmount);
      team += Number.isFinite(paid) && paid > 0 ? paid : Number(member.dailyRate) || 0;
    }
  }
  return { artisan, shop, team };
}

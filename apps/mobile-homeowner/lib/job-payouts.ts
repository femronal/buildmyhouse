type PayoutLine = {
  payeeKind?: string | null;
  status?: string | null;
  totalPrice?: number | null;
  quantity?: number | null;
  unitPrice?: number | null;
};

type PayoutStage = {
  materials?: PayoutLine[] | null;
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

/** Paid artisan and shop totals from the stage lines already on the project. */
export function paidPayoutsFromStages(stages?: PayoutStage[] | null): { artisan: number; shop: number } {
  let artisan = 0;
  let shop = 0;
  for (const stage of stages || []) {
    for (const line of stage?.materials || []) {
      if (String(line?.status || '').trim().toLowerCase() !== 'paid') continue;
      const amount = lineAmount(line);
      const kind = String(line?.payeeKind || '').trim().toLowerCase();
      if (kind === 'artisan') artisan += amount;
      else if (kind === 'shop') shop += amount;
    }
  }
  return { artisan, shop };
}

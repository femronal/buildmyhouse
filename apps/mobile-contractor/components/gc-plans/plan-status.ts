export type PlanListStatus = 'live' | 'pending' | 'rejected' | 'hidden' | 'draft';

export function getPlanStatus(design: {
  adminApprovalStatus?: string | null;
  isActive?: boolean | null;
}): Exclude<PlanListStatus, 'draft'> {
  if (design.adminApprovalStatus === 'rejected') return 'rejected';
  if (design.adminApprovalStatus === 'pending') return 'pending';
  if (design.adminApprovalStatus === 'approved' && design.isActive === false) return 'hidden';
  return 'live';
}

export function planStatusLabel(status: PlanListStatus) {
  if (status === 'live') return 'Live';
  if (status === 'pending') return 'Pending review';
  if (status === 'rejected') return 'Rejected';
  if (status === 'hidden') return 'Hidden';
  return 'Draft';
}

const TAG_LABELS: Record<string, string> = {
  repair: 'Repair',
  upgrades: 'Upgrades',
  renovation: 'Renovation',
  full_builds: 'Full builds',
};

export function planTypeLine(design: {
  projectTypeTag?: string | null;
  projectTypeFilter?: string | null;
  planType?: string | null;
}) {
  const tag = design.projectTypeTag ? TAG_LABELS[design.projectTypeTag] || design.projectTypeTag : '';
  const filter = String(design.projectTypeFilter || '').trim();
  return [tag, filter].filter(Boolean).join(' · ');
}

export function showsPlanSpecs(design: {
  planType?: string | null;
  projectTypeTag?: string | null;
}) {
  if (design.projectTypeTag === 'repair') return false;
  return design.planType === 'homebuilding' || design.planType === 'renovation';
}

export function specLine(design: {
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareMeters?: number | null;
  squareFootage?: number | null;
}) {
  const parts: string[] = [];
  if (positive(design.bedrooms)) parts.push(`${design.bedrooms} bed`);
  if (positive(design.bathrooms)) parts.push(`${design.bathrooms} bath`);
  const meters = positive(design.squareMeters)
    ? Number(design.squareMeters)
    : positive(design.squareFootage)
      ? Math.round(Number(design.squareFootage) * 0.092903)
      : 0;
  if (meters > 0) parts.push(`${meters} m²`);
  return parts.join(' · ');
}

function positive(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

import { ALL_LOCATIONS_FILTER, locationMatchesLgaFilter, resolveLagosLga } from '@/lib/lagos-lgas';
import { composeLocationLabel, normalizeLocationText, resolvePopularAreaToLga } from '@/lib/nigeria-lgas';

export { ALL_LOCATIONS_FILTER, LAGOS_LGAS } from '@/lib/lagos-lgas';

export function getDesignLocationLabel(design: any): string {
  const profile = design?.createdBy?.contractorProfile;
  const stateLabel = `${profile?.stateLabel || ''}`.trim();
  const lgaLabel = `${profile?.lgaLabel || ''}`.trim();
  if (stateLabel && lgaLabel) return composeLocationLabel(lgaLabel, stateLabel);
  if (stateLabel) return `${stateLabel}, Nigeria`;

  const raw =
    profile?.location ||
    design?.serviceLocation ||
    design?.location ||
    '';

  const trimmed = `${raw}`.trim();
  return trimmed || 'Nigeria';
}

export function getDesignLocationSearchFields(design: any): string[] {
  const profile = design?.createdBy?.contractorProfile;
  const label = getDesignLocationLabel(design);
  const resolvedLga = resolveLagosLga(label);
  return [
    label,
    resolvedLga,
    profile?.stateLabel,
    profile?.lgaLabel,
    profile?.location,
  ].filter(Boolean) as string[];
}

export function designMatchesLocationFilter(design: any, locationFilter: string, stateFilter = 'All'): boolean {
  if (!locationFilter || locationFilter === ALL_LOCATIONS_FILTER) return true;
  const profile = design?.createdBy?.contractorProfile;
  const stateLabel = `${profile?.stateLabel || ''}`.trim();
  const lgaLabel = `${profile?.lgaLabel || ''}`.trim();
  if (stateFilter && stateFilter !== 'All' && stateLabel) {
    if (normalizeLocationText(stateLabel) !== normalizeLocationText(stateFilter)) return false;
    const canonical = resolvePopularAreaToLga(stateFilter, locationFilter) || locationFilter;
    if (!lgaLabel) return false;
    const profileNorm = normalizeLocationText(lgaLabel);
    return (
      profileNorm === normalizeLocationText(canonical) ||
      profileNorm === normalizeLocationText(locationFilter)
    );
  }
  return locationMatchesLgaFilter(getDesignLocationLabel(design), locationFilter);
}

export function getDesignLocationTag(design: any): { label: string; lga: string | null } {
  const profile = design?.createdBy?.contractorProfile;
  const label = getDesignLocationLabel(design);
  return {
    label,
    lga: profile?.lgaLabel || resolveLagosLga(label),
  };
}

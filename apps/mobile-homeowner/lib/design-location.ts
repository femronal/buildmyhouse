import { ALL_LOCATIONS_FILTER, locationMatchesLgaFilter, resolveLagosLga } from '@/lib/lagos-lgas';

export { ALL_LOCATIONS_FILTER, LAGOS_LGAS } from '@/lib/lagos-lgas';

export function getDesignLocationLabel(design: any): string {
  const raw =
    design?.createdBy?.contractorProfile?.location ||
    design?.serviceLocation ||
    design?.location ||
    '';

  const trimmed = `${raw}`.trim();
  return trimmed || 'Lagos, Nigeria';
}

export function getDesignLocationSearchFields(design: any): string[] {
  const label = getDesignLocationLabel(design);
  const resolvedLga = resolveLagosLga(label);
  return [label, resolvedLga].filter(Boolean) as string[];
}

export function designMatchesLocationFilter(design: any, locationFilter: string): boolean {
  return locationMatchesLgaFilter(getDesignLocationLabel(design), locationFilter);
}

export function getDesignLocationTag(design: any): { label: string; lga: string | null } {
  const label = getDesignLocationLabel(design);
  return {
    label,
    lga: resolveLagosLga(label),
  };
}

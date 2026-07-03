import { splitCommaList } from '@buildmyhouse/shared-types';
import type { BuildOpportunityCategoryKey } from '@buildmyhouse/shared-types';

type HouseForm = Record<string, string>;

export function resolveOpportunityTypeFromForm(form: HouseForm): string {
  if (form.opportunityType === '__custom__') {
    return form.opportunityTypeCustom
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
  return form.opportunityType;
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalFloat(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildHousePayloadFields(form: HouseForm) {
  const category = (form.opportunityCategory || 'residential') as BuildOpportunityCategoryKey;
  const squareMeters = parseOptionalFloat(form.squareMeters);
  let squareFootage = parseOptionalFloat(form.squareFootage);
  if (!squareFootage && squareMeters) {
    squareFootage = Math.round(squareMeters / 0.092903);
  }
  if (!squareFootage) {
    squareFootage = category === 'residential' ? 0 : 1;
  }

  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    opportunityCategory: form.opportunityCategory || undefined,
    opportunityType: resolveOpportunityTypeFromForm(form) || undefined,
    location: form.location.trim(),
    price: parseFloat(form.price) || 0,
    bedrooms: parseOptionalInt(form.bedrooms) ?? 1,
    bathrooms: parseOptionalInt(form.bathrooms) ?? 1,
    squareFootage,
    squareMeters,
    propertyType: form.propertyType.trim() || undefined,
    yearBuilt: parseOptionalInt(form.yearBuilt),
    condition: form.condition.trim() || undefined,
    parking: parseOptionalInt(form.parking),
    documents: splitCommaList(form.documents),
    amenities: splitCommaList(form.amenities),
    nearbyFacilities: splitCommaList(form.nearbyFacilities),
    contactName: form.contactName.trim() || undefined,
    contactPhone: form.contactPhone.trim() || undefined,
  };
}

export function buildLandPayloadFields(form: HouseForm) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    opportunityCategory: form.opportunityCategory || undefined,
    opportunityType: resolveOpportunityTypeFromForm(form) || undefined,
    location: form.location.trim(),
    price: parseFloat(form.price) || 0,
    sizeSqm: parseFloat(form.sizeSqm) || 0,
    titleDocument: form.titleDocument.trim() || undefined,
    zoningType: form.zoningType.trim() || undefined,
    topography: form.topography.trim() || undefined,
    roadAccess: form.roadAccess.trim() || undefined,
    ownershipType: form.ownershipType.trim() || undefined,
    documents: splitCommaList(form.documents),
    nearbyLandmarks: splitCommaList(form.nearbyLandmarks),
    restrictions: splitCommaList(form.restrictions),
    contactName: form.contactName.trim() || undefined,
    contactPhone: form.contactPhone.trim() || undefined,
  };
}

export function buildRentalPayloadFields(form: HouseForm) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    opportunityCategory: form.opportunityCategory || undefined,
    opportunityType: resolveOpportunityTypeFromForm(form) || undefined,
    propertyType: form.propertyType.trim() || 'House',
    location: form.location.trim(),
    annualRent: parseFloat(form.annualRent) || 0,
    serviceCharge: parseFloat(form.serviceCharge) || 0,
    cautionDeposit: parseFloat(form.cautionDeposit) || 0,
    legalFeePercent: parseFloat(form.legalFeePercent) || 10,
    agencyFeePercent: parseFloat(form.agencyFeePercent) || 2,
    bedrooms: parseOptionalInt(form.bedrooms) ?? 1,
    bathrooms: parseOptionalInt(form.bathrooms) ?? 1,
    sizeSqm: parseFloat(form.sizeSqm) || 0,
    furnishing: form.furnishing.trim() || undefined,
    paymentPattern: form.paymentPattern.trim() || undefined,
    power: form.power.trim() || undefined,
    water: form.water.trim() || undefined,
    internet: form.internet.trim() || undefined,
    parking: form.parking.trim() || undefined,
    security: form.security.trim() || undefined,
    rules: form.rules.trim() || undefined,
    inspectionWindow: form.inspectionWindow.trim() || undefined,
    proximity: splitCommaList(form.proximity),
    verificationDocs: splitCommaList(form.verificationDocs),
  };
}

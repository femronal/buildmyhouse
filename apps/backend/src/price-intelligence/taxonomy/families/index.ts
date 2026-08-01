import { ProductFamily } from '../types';
import { ENERGY_SECURITY_FAMILIES } from './energy-security.data';
import { ENVELOPE_FAMILIES } from './envelope.data';
import { FINISHES_FAMILIES } from './finishes.data';
import { MEP_FAMILIES } from './mep.data';
import { STRUCTURAL_FAMILIES } from './structural.data';

/** All Level 1 (deep launch) product families — 25 total. */
export const LEVEL1_FAMILIES: readonly ProductFamily[] = [
  ...STRUCTURAL_FAMILIES,
  ...ENVELOPE_FAMILIES,
  ...FINISHES_FAMILIES,
  ...MEP_FAMILIES,
  ...ENERGY_SECURITY_FAMILIES,
];

const FAMILY_INDEX = new Map(LEVEL1_FAMILIES.map((f) => [f.key, f]));

export function getFamilyByKey(key: string): ProductFamily | undefined {
  return FAMILY_INDEX.get(key);
}

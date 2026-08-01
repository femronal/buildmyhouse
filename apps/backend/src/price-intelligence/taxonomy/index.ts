/**
 * Price Checker Stage 2 taxonomy — public module surface.
 * Design docs live in docs/price-checker/.
 */
export * from './types';
export * from './units';
export * from './locations';
export * from './evidence';
export * from './matching';
export * from './questions';
export * from './custom-research';
export * from './review';
export * from './matrix';
export { LEVEL1_FAMILIES, getFamilyByKey } from './families';
export { EXPANSION_FAMILIES } from './expansion.data';
export { SERVICE_FAMILIES, getServiceByKey } from './services.data';
export { FAMILY_PRIORITIES, rankedPriorities, totalScore } from './priority.data';

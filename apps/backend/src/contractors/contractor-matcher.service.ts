import { Injectable } from '@nestjs/common';

type ProjectTag = 'repair' | 'upgrades' | 'renovation' | 'full_builds' | 'unknown';
type GCSpecialtyCategory = 'repairer' | 'upgrader' | 'renovator' | 'general_contractor';

export interface ContractorMatcherProjectInput {
  id: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  budget?: number | null;
  projectType?: string | null;
  aiAnalysis?: any;
}

export interface ContractorMatcherRequestStats {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
  responded: number;
  responseRate: number;
  acceptanceRate: number;
  avgResponseHours: number | null;
}

export interface ContractorMatcherDisputeStats {
  total: number;
  open: number;
  inReview: number;
  resolved: number;
}

export interface ContractorMatcherCandidateInput {
  id: string;
  userId: string;
  name?: string | null;
  specialty?: string | null;
  specialtyCategory?: string | null;
  specialtyTags?: string[];
  description?: string | null;
  location?: string | null;
  experienceYears?: number | null;
  rating?: number | null;
  reviews?: number | null;
  projects?: number | null;
  verified?: boolean;
  hiringFee?: number | null;
  imageUrl?: string | null;
  user?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    pictureUrl?: string | null;
    role?: string | null;
    verified?: boolean | null;
  } | null;
  certificationCount?: number;
  requestStats?: ContractorMatcherRequestStats;
  disputeStats?: ContractorMatcherDisputeStats;
  designProjectTypeFilters?: string[];
}

export interface MatchBreakdown {
  capabilityFit: number;
  geoFit: number;
  qualityReliability: number;
  commercialFit: number;
  confidenceAdjustment: number;
}

export interface ContractorMatchResult extends ContractorMatcherCandidateInput {
  matchScore: number;
  matchVersion: 'v1';
  matchBreakdown: MatchBreakdown;
  matchReasons: string[];
  matchProjectTag: ProjectTag;
}

export interface ContractorMatcherDiagnostics {
  algorithmVersion: 'v1';
  projectId: string;
  projectTag: ProjectTag;
  requestedLimit: number;
  totalCandidates: number;
  eligibleCount: number;
  selectedCount: number;
  filteredCounts: {
    nonGcRole: number;
    unverified: number;
    profileIncomplete: number;
    specialtyMismatch: number;
    locationMismatch: number;
  };
}

export interface ContractorMatcherResult {
  matches: ContractorMatchResult[];
  diagnostics: ContractorMatcherDiagnostics;
}

const HARD_FILTER_REASON_KEYS = [
  'nonGcRole',
  'unverified',
  'profileIncomplete',
  'specialtyMismatch',
  'locationMismatch',
] as const;

type HardFilterReasonKey = (typeof HARD_FILTER_REASON_KEYS)[number];

const FULL_BUILD_KEYWORDS = [
  'bungalow',
  'duplex',
  'triplex',
  'terrace',
  'maisonette',
  'highrise',
  'high-rise',
  'skyscraper',
  'tower',
  'multiplex',
  'estate',
  'shell',
  'turnkey',
  'blockwork',
  'roofing',
  'newbuild',
  'new-build',
] as const;

const NIGERIAN_STATES = [
  'abia',
  'adamawa',
  'akwa ibom',
  'anambra',
  'bauchi',
  'bayelsa',
  'benue',
  'borno',
  'cross river',
  'delta',
  'ebonyi',
  'edo',
  'ekiti',
  'enugu',
  'gombe',
  'imo',
  'jigawa',
  'kaduna',
  'kano',
  'katsina',
  'kebbi',
  'kogi',
  'kwara',
  'lagos',
  'nasarawa',
  'niger',
  'ogun',
  'ondo',
  'osun',
  'oyo',
  'plateau',
  'rivers',
  'sokoto',
  'taraba',
  'yobe',
  'zamfara',
  'abuja',
  'fct',
] as const;

const REPAIR_KEYWORDS = ['repair', 'fix', 'maintenance', 'troubleshoot', 'leak', 'fault'] as const;
const UPGRADE_KEYWORDS = ['upgrade', 'remodel', 'modernize', 'fitout', 'fit-out'] as const;
const RENOVATION_KEYWORDS = ['renovat', 'rehab', 'refurbish', 'restoration', 'retrofit'] as const;
const GENERAL_CONTRACTOR_KEYWORDS = [
  'general contractor',
  'general construction',
  'homebuilding',
  'home building',
  'residential building',
  'commercial building',
  'building contractor',
  'construction',
] as const;

interface EligibleCandidate {
  candidate: ContractorMatcherCandidateInput;
  projectTag: ProjectTag;
  normalizedState: string;
  normalizedCity: string;
  profileCompletenessScore: number;
}

@Injectable()
export class ContractorMatcherService {
  private normalize(text?: string | null): string {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  private tokenize(text?: string | null): string[] {
    return this.normalize(text)
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3);
  }

  private inferProjectTag(project: ContractorMatcherProjectInput): ProjectTag {
    const ai = project.aiAnalysis || {};
    const candidates = [
      ai.projectTypeTag,
      ai.projectTypeFilter,
      ai.projectType,
      project.projectType,
      ai.planType,
    ]
      .map((value) => this.normalize(String(value || '')))
      .filter(Boolean);

    for (const value of candidates) {
      if (value.includes('repair')) return 'repair';
      if (value.includes('upgrade')) return 'upgrades';
      if (value.includes('renovat')) return 'renovation';
      if (value.includes('full_build') || value.includes('homebuilding')) return 'full_builds';
      if (value.includes('interior_design')) return 'upgrades';
      const valueTokens = new Set(this.tokenize(value));
      for (const keyword of FULL_BUILD_KEYWORDS) {
        if (valueTokens.has(keyword) || value.includes(keyword)) {
          return 'full_builds';
        }
      }
    }
    return 'unknown';
  }

  private extractProjectLocation(project: ContractorMatcherProjectInput): {
    state: string;
    city: string;
  } {
    const state = this.extractStateToken(project.state);
    const city = this.normalize(project.city);

    if (state || city) {
      return { state, city };
    }

    const address = this.normalize(project.address);
    if (!address) {
      return { state: '', city: '' };
    }

    const addressParts = address.split(',').map((part) => part.trim()).filter(Boolean);
    const inferredState = this.extractStateToken(addressParts[addressParts.length - 2]);
    const inferredCity = this.normalize(addressParts[addressParts.length - 3]);
    return { state: inferredState, city: inferredCity };
  }

  private getRequiredCategories(projectTag: ProjectTag): GCSpecialtyCategory[] {
    if (projectTag === 'repair') return ['repairer'];
    if (projectTag === 'upgrades') return ['upgrader'];
    if (projectTag === 'renovation') return ['renovator'];
    if (projectTag === 'full_builds') return ['general_contractor'];
    return ['general_contractor', 'renovator', 'upgrader', 'repairer'];
  }

  private extractStateToken(value?: string | null): string {
    const normalized = this.normalize(value);
    if (!normalized) return '';
    const padded = ` ${normalized} `;
    for (const state of NIGERIAN_STATES) {
      if (padded.includes(` ${state} `)) {
        return state === 'fct' ? 'abuja' : state;
      }
    }
    return normalized.split(',')[0]?.trim() || normalized;
  }

  private getCandidateTokens(candidate: ContractorMatcherCandidateInput): Set<string> {
    const tokenSet = new Set<string>();
    for (const tag of candidate.specialtyTags || []) {
      for (const token of this.tokenize(tag)) {
        tokenSet.add(token);
      }
    }
    for (const token of this.tokenize(candidate.specialty)) {
      tokenSet.add(token);
    }
    for (const token of this.tokenize(candidate.description)) {
      tokenSet.add(token);
    }
    for (const designFilter of candidate.designProjectTypeFilters || []) {
      for (const token of this.tokenize(designFilter)) {
        tokenSet.add(token);
      }
    }
    return tokenSet;
  }

  private requiredSpecialtyTokenOverlap(projectTag: ProjectTag): number {
    if (projectTag === 'full_builds') return 1;
    if (projectTag === 'unknown') return 1;
    return 2;
  }

  private inferCategoryFromTokens(candidateTokens: Set<string>): GCSpecialtyCategory | null {
    const tokenArray = Array.from(candidateTokens);
    const hasKeyword = (keywords: readonly string[]) =>
      keywords.some((keyword) => {
        const keywordNorm = this.normalize(keyword);
        const keywordTokens = this.tokenize(keywordNorm);
        const phraseMatched = tokenArray.some(
          (token) =>
            token === keywordNorm ||
            token.includes(keywordNorm) ||
            keywordNorm.includes(token),
        );
        if (phraseMatched) return true;
        return keywordTokens.some((kt) =>
          tokenArray.some((token) => token === kt || token.includes(kt) || kt.includes(token)),
        );
      });

    if (hasKeyword(GENERAL_CONTRACTOR_KEYWORDS)) return 'general_contractor';
    if (hasKeyword(FULL_BUILD_KEYWORDS)) return 'general_contractor';
    if (hasKeyword(RENOVATION_KEYWORDS)) return 'renovator';
    if (hasKeyword(UPGRADE_KEYWORDS)) return 'upgrader';
    if (hasKeyword(REPAIR_KEYWORDS)) return 'repairer';
    return null;
  }

  private getResolvedCandidateCategory(candidate: ContractorMatcherCandidateInput): GCSpecialtyCategory | null {
    const explicit = this.normalize(candidate.specialtyCategory) as GCSpecialtyCategory;
    if (explicit && ['repairer', 'upgrader', 'renovator', 'general_contractor'].includes(explicit)) {
      return explicit;
    }
    const candidateTokens = this.getCandidateTokens(candidate);
    const inferred = this.inferCategoryFromTokens(candidateTokens);
    if (inferred) return inferred;
    // Legacy fallback: all candidates entering this matcher are GC profiles.
    return this.normalize(candidate.user?.role) === 'general_contractor' ? 'general_contractor' : null;
  }

  private getProjectTokens(project: ContractorMatcherProjectInput): Set<string> {
    const ai = project.aiAnalysis || {};
    const values: string[] = [
      String(ai.summary || ''),
      String(ai.successCriteria || ''),
      String(ai.projectTypeFilter || ''),
      String(ai.projectTypeTag || ''),
      ...(Array.isArray(ai.rooms) ? ai.rooms.map((item: any) => String(item || '')) : []),
      ...(Array.isArray(ai.materials) ? ai.materials.map((item: any) => String(item || '')) : []),
      ...(Array.isArray(ai.features) ? ai.features.map((item: any) => String(item || '')) : []),
    ];

    const tokenSet = new Set<string>();
    for (const value of values) {
      for (const token of this.tokenize(value)) {
        tokenSet.add(token);
      }
    }
    return tokenSet;
  }

  private computeProfileCompleteness(candidate: ContractorMatcherCandidateInput): number {
    const checks = [
      this.normalize(candidate.location).length > 0,
      this.normalize(candidate.description).length >= 24,
      (candidate.specialtyTags || []).length > 0 || this.normalize(candidate.specialty).length > 0,
      Number(candidate.experienceYears || 0) > 0,
      Number(candidate.projects || 0) > 0,
      Number(candidate.reviews || 0) > 0,
      Number(candidate.certificationCount || 0) > 0,
    ];
    const passed = checks.filter(Boolean).length;
    return passed / checks.length;
  }

  private isLocationEligible(projectState: string, contractorLocation?: string | null): boolean {
    if (!projectState) return true;
    const contractorState = this.extractStateToken(contractorLocation);
    if (!contractorState) return false;
    return contractorState === projectState;
  }

  private isSpecialtyEligible(
    projectTag: ProjectTag,
    candidate: ContractorMatcherCandidateInput,
    projectTokens: Set<string>,
  ): boolean {
    const category = this.getResolvedCandidateCategory(candidate);
    const required = new Set(this.getRequiredCategories(projectTag));
    if (projectTag !== 'unknown') {
      return !!category && required.has(category);
    }

    if (category && required.has(category)) {
      return true;
    }

    const candidateTokens = this.getCandidateTokens(candidate);
    let overlap = 0;
    const minOverlap = this.requiredSpecialtyTokenOverlap(projectTag);
    for (const token of projectTokens) {
      if (candidateTokens.has(token)) overlap += 1;
      if (overlap >= minOverlap) return true;
    }

    if (projectTag === 'unknown' && candidateTokens.size > 0) {
      return true;
    }
    return false;
  }

  private scoreCapability(
    projectTag: ProjectTag,
    candidate: ContractorMatcherCandidateInput,
    projectTokens: Set<string>,
  ): number {
    const requiredCategories = this.getRequiredCategories(projectTag);
    const category = this.normalize(candidate.specialtyCategory) as GCSpecialtyCategory;
    const candidateTokens = this.getCandidateTokens(candidate);

    let score = 0;
    if (requiredCategories[0] === category) score += 18;
    else if (requiredCategories.includes(category)) score += 13;
    else if (category === 'general_contractor') score += 11;

    let overlap = 0;
    for (const token of projectTokens) {
      if (candidateTokens.has(token)) overlap += 1;
    }
    score += Math.min(10, overlap * 2);

    const experienceYears = Math.max(0, Number(candidate.experienceYears || 0));
    score += Math.min(7, experienceYears * 0.8);

    return Math.max(0, Math.min(35, score));
  }

  private scoreGeo(projectState: string, projectCity: string, candidate: ContractorMatcherCandidateInput): number {
    const location = this.normalize(candidate.location);
    if (!location) return 0;

    let score = 0;
    if (projectState && location.includes(projectState)) {
      score += 14;
    } else if (projectState) {
      return 0;
    } else {
      score += 8;
    }

    if (projectCity && location.includes(projectCity)) {
      score += 9;
    } else if (projectCity) {
      score += 2;
    }

    score += location.split(',').length > 1 ? 2 : 1;
    return Math.max(0, Math.min(25, score));
  }

  private scoreQuality(candidate: ContractorMatcherCandidateInput): number {
    const rating = Math.max(0, Math.min(5, Number(candidate.rating || 0)));
    const reviews = Math.max(0, Number(candidate.reviews || 0));
    const projects = Math.max(0, Number(candidate.projects || 0));
    const disputes = candidate.disputeStats || {
      total: 0,
      open: 0,
      inReview: 0,
      resolved: 0,
    };

    const reviewConfidence = Math.min(1, reviews / 25);
    const ratingScore = (rating / 5) * 11 * (0.4 + 0.6 * reviewConfidence);
    const reviewScore = Math.min(5, Math.log10(reviews + 1) * 2.6);
    const projectScore = Math.min(5, Math.log10(projects + 1) * 2.9);
    const disputePenalty = Math.min(8, disputes.open * 2 + disputes.inReview * 1.2);

    const total = ratingScore + reviewScore + projectScore - disputePenalty;
    return Math.max(0, Math.min(25, total));
  }

  private scoreCommercial(projectBudget: number, candidate: ContractorMatcherCandidateInput): number {
    const requestStats = candidate.requestStats || {
      total: 0,
      accepted: 0,
      rejected: 0,
      pending: 0,
      responded: 0,
      responseRate: 0,
      acceptanceRate: 0,
      avgResponseHours: null,
    };

    const hiringFee = Math.max(0, Number(candidate.hiringFee || 0));
    let budgetScore = 4;
    if (projectBudget > 0 && hiringFee > 0) {
      const ratio = hiringFee / projectBudget;
      if (ratio <= 0.02) budgetScore = 8;
      else if (ratio <= 0.05) budgetScore = 7;
      else if (ratio <= 0.1) budgetScore = 5.5;
      else budgetScore = 3;
    } else if (projectBudget > 0) {
      budgetScore = 5;
    }

    const responseScore = Math.min(4, requestStats.responseRate * 4);
    const acceptanceScore = Math.min(2.5, requestStats.acceptanceRate * 2.5);
    const speedScore =
      requestStats.avgResponseHours === null
        ? 0.8
        : requestStats.avgResponseHours <= 24
          ? 1.3
          : requestStats.avgResponseHours <= 72
            ? 0.8
            : 0.3;

    return Math.max(0, Math.min(15, budgetScore + responseScore + acceptanceScore + speedScore));
  }

  private buildReasons(
    candidate: ContractorMatcherCandidateInput,
    projectTag: ProjectTag,
    breakdown: MatchBreakdown,
    projectCity: string,
    projectState: string,
  ): string[] {
    const reasons: string[] = [];
    const category = this.normalize(candidate.specialtyCategory);
    const rating = Number(candidate.rating || 0);
    const reviews = Number(candidate.reviews || 0);
    const responseRate = candidate.requestStats?.responseRate || 0;

    if (breakdown.capabilityFit >= 24) {
      if (category) {
        reasons.push(`Strong ${category.replace('_', ' ')} specialty fit for this ${projectTag.replace('_', ' ')} project`);
      } else {
        reasons.push('Strong capability fit based on specialty tags and past project profile');
      }
    }
    if (breakdown.geoFit >= 18 && (projectCity || projectState)) {
      const locationTarget = projectCity || projectState;
      reasons.push(`Works in or near ${locationTarget}`);
    }
    if (breakdown.qualityReliability >= 16 && rating >= 4.5) {
      reasons.push(`High quality signal (${rating.toFixed(1)} rating across ${reviews} review${reviews === 1 ? '' : 's'})`);
    }
    if (breakdown.commercialFit >= 10 && responseRate >= 0.65) {
      reasons.push('Strong response behavior and commercial alignment');
    }
    if (Number(candidate.certificationCount || 0) > 0) {
      reasons.push(`Has ${candidate.certificationCount} verification document${candidate.certificationCount === 1 ? '' : 's'} on file`);
    }

    return reasons.slice(0, 4);
  }

  private getClusterKey(candidate: ContractorMatcherCandidateInput): string {
    const category = this.normalize(candidate.specialtyCategory) || 'uncategorized';
    const location = this.normalize(candidate.location);
    const cityToken = location.split(',')[0] || 'any-city';
    const stateToken = location.split(',').slice(-1)[0] || 'any-state';
    return `${category}:${cityToken}:${stateToken}`;
  }

  private applyDiversity(matches: ContractorMatchResult[], limit: number): ContractorMatchResult[] {
    if (matches.length <= limit) {
      return matches.slice(0, limit);
    }

    const perClusterLimit = Math.max(1, Math.floor(limit / 2));
    const selected: ContractorMatchResult[] = [];
    const overflow: ContractorMatchResult[] = [];
    const clusterCounts = new Map<string, number>();

    for (const match of matches) {
      const key = this.getClusterKey(match);
      const count = clusterCounts.get(key) || 0;
      if (count < perClusterLimit && selected.length < limit) {
        selected.push(match);
        clusterCounts.set(key, count + 1);
      } else {
        overflow.push(match);
      }
    }

    for (const match of overflow) {
      if (selected.length >= limit) break;
      selected.push(match);
    }

    return selected;
  }

  recommend(input: {
    project: ContractorMatcherProjectInput;
    candidates: ContractorMatcherCandidateInput[];
    limit?: number;
  }): ContractorMatcherResult {
    const requestedLimit = Math.max(1, Number(input.limit || 3));
    const projectTag = this.inferProjectTag(input.project);
    const { state: projectState, city: projectCity } = this.extractProjectLocation(input.project);
    const projectTokens = this.getProjectTokens(input.project);
    const projectBudget = Math.max(0, Number(input.project.budget || 0));

    const filteredCounts: Record<HardFilterReasonKey, number> = {
      nonGcRole: 0,
      unverified: 0,
      profileIncomplete: 0,
      specialtyMismatch: 0,
      locationMismatch: 0,
    };

    const eligibleCandidates: EligibleCandidate[] = [];
    for (const candidate of input.candidates) {
      if (this.normalize(candidate.user?.role) !== 'general_contractor') {
        filteredCounts.nonGcRole += 1;
        continue;
      }
      if (!candidate.verified || !candidate.user?.verified) {
        filteredCounts.unverified += 1;
        continue;
      }

      const profileCompletenessScore = this.computeProfileCompleteness(candidate);
      if (profileCompletenessScore < 0.34) {
        filteredCounts.profileIncomplete += 1;
        continue;
      }

      if (!this.isSpecialtyEligible(projectTag, candidate, projectTokens)) {
        filteredCounts.specialtyMismatch += 1;
        continue;
      }

      if (!this.isLocationEligible(projectState, candidate.location)) {
        filteredCounts.locationMismatch += 1;
        continue;
      }

      eligibleCandidates.push({
        candidate,
        projectTag,
        normalizedState: projectState,
        normalizedCity: projectCity,
        profileCompletenessScore,
      });
    }

    const scored = eligibleCandidates.map((entry) => {
      const capabilityFit = this.scoreCapability(entry.projectTag, entry.candidate, projectTokens);
      const geoFit = this.scoreGeo(entry.normalizedState, entry.normalizedCity, entry.candidate);
      const qualityReliability = this.scoreQuality(entry.candidate);
      const commercialFit = this.scoreCommercial(projectBudget, entry.candidate);

      const rawScore = capabilityFit + geoFit + qualityReliability + commercialFit;
      const confidenceBoost = (entry.profileCompletenessScore - 0.5) * 8;
      const confidenceAdjustment = Math.max(-4, Math.min(4, confidenceBoost));
      const matchScore = Math.max(0, Math.min(100, Math.round(rawScore + confidenceAdjustment)));

      const breakdown: MatchBreakdown = {
        capabilityFit: Number(capabilityFit.toFixed(1)),
        geoFit: Number(geoFit.toFixed(1)),
        qualityReliability: Number(qualityReliability.toFixed(1)),
        commercialFit: Number(commercialFit.toFixed(1)),
        confidenceAdjustment: Number(confidenceAdjustment.toFixed(1)),
      };

      const matchReasons = this.buildReasons(
        entry.candidate,
        entry.projectTag,
        breakdown,
        entry.normalizedCity,
        entry.normalizedState,
      );

      return {
        ...entry.candidate,
        matchScore,
        matchVersion: 'v1' as const,
        matchBreakdown: breakdown,
        matchReasons,
        matchProjectTag: entry.projectTag,
      };
    });

    scored.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      const responseA = a.requestStats?.responseRate || 0;
      const responseB = b.requestStats?.responseRate || 0;
      if (responseB !== responseA) return responseB - responseA;
      const projectsA = Number(a.projects || 0);
      const projectsB = Number(b.projects || 0);
      if (projectsB !== projectsA) return projectsB - projectsA;
      const ratingA = Number(a.rating || 0);
      const ratingB = Number(b.rating || 0);
      if (ratingB !== ratingA) return ratingB - ratingA;
      return String(a.id).localeCompare(String(b.id));
    });

    const selected = this.applyDiversity(scored, requestedLimit);

    return {
      matches: selected,
      diagnostics: {
        algorithmVersion: 'v1',
        projectId: input.project.id,
        projectTag,
        requestedLimit,
        totalCandidates: input.candidates.length,
        eligibleCount: eligibleCandidates.length,
        selectedCount: selected.length,
        filteredCounts,
      },
    };
  }
}


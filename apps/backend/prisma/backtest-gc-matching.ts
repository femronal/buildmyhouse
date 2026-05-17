import { PrismaClient } from '@prisma/client';
import {
  ContractorMatcherCandidateInput,
  ContractorMatcherService,
} from '../src/contractors/contractor-matcher.service';

const prisma = new PrismaClient() as any;
const matcher = new ContractorMatcherService();
const TOP_N = 3;

function legacyRecommend(project: any, contractors: ContractorMatcherCandidateInput[], limit: number) {
  const strict = contractors.filter((contractor) => {
    const ratingOk = Number(contractor.rating || 0) >= 4.5;
    const cityOk = project.city
      ? String(contractor.location || '')
          .toLowerCase()
          .includes(String(project.city || '').toLowerCase())
      : true;
    return ratingOk && cityOk;
  });
  const pool = strict.length > 0 ? strict : contractors;

  const scored = pool.map((contractor) => {
    let matchScore = 70;
    if (
      project.city &&
      String(contractor.location || '')
        .toLowerCase()
        .includes(String(project.city || '').toLowerCase())
    ) {
      matchScore += 15;
    }
    if (
      project.state &&
      String(contractor.location || '')
        .toLowerCase()
        .includes(String(project.state || '').toLowerCase())
    ) {
      matchScore += 10;
    }
    if (Number(contractor.rating || 0) >= 4.9) matchScore += 5;
    else if (Number(contractor.rating || 0) >= 4.7) matchScore += 3;
    if (Number(contractor.projects || 0) >= 80) matchScore += 5;
    else if (Number(contractor.projects || 0) >= 50) matchScore += 3;
    if (contractor.verified) matchScore += 5;

    return {
      ...contractor,
      matchScore: Math.min(100, Math.round(matchScore)),
    };
  });
  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, limit);
}

async function runBacktest() {
  const projects = await prisma.project.findMany({
    where: {
      generalContractorId: null,
      status: { in: ['draft', 'pending_payment'] },
    },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      address: true,
      budget: true,
      projectType: true,
      aiAnalysis: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });

  if (projects.length === 0) {
    console.log('No recent projects found for backtest.');
    return;
  }

  const contractors = await prisma.contractor.findMany({
    where: {
      type: 'general_contractor',
      verified: true,
    },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          verified: true,
          fullName: true,
          email: true,
          pictureUrl: true,
        },
      },
      _count: {
        select: {
          certifications: true,
        },
      },
    },
  });

  const contractorUserIds = contractors.map((item: any) => item.userId);
  const [requests, disputes] = await Promise.all([
    prisma.projectRequest.findMany({
      where: { contractorId: { in: contractorUserIds } },
      select: { contractorId: true, status: true, sentAt: true, respondedAt: true },
    }),
    prisma.projectStageDispute.findMany({
      where: { generalContractorId: { in: contractorUserIds } },
      select: { generalContractorId: true, status: true },
    }),
  ]);

  const requestsByContractor = new Map<string, any[]>();
  for (const row of requests) {
    if (!requestsByContractor.has(row.contractorId)) requestsByContractor.set(row.contractorId, []);
    requestsByContractor.get(row.contractorId)!.push(row);
  }

  const disputesByContractor = new Map<string, any[]>();
  for (const row of disputes) {
    if (!row.generalContractorId) continue;
    if (!disputesByContractor.has(row.generalContractorId)) {
      disputesByContractor.set(row.generalContractorId, []);
    }
    disputesByContractor.get(row.generalContractorId)!.push(row);
  }

  const enrichedCandidates: ContractorMatcherCandidateInput[] = contractors.map((candidate: any) => {
    const requestRows = requestsByContractor.get(candidate.userId) || [];
    const respondedRows = requestRows.filter((row: any) => !!row.respondedAt);
    const responseRate = requestRows.length > 0 ? respondedRows.length / requestRows.length : 0;
    const acceptanceRate =
      requestRows.length > 0
        ? requestRows.filter((row: any) => row.status === 'accepted').length / requestRows.length
        : 0;

    const avgResponseHours =
      respondedRows.length > 0
        ? respondedRows.reduce((sum: number, row: any) => {
            const sentAt = new Date(row.sentAt || 0).getTime();
            const respondedAt = new Date(row.respondedAt || 0).getTime();
            const hours = sentAt && respondedAt && respondedAt >= sentAt
              ? (respondedAt - sentAt) / (1000 * 60 * 60)
              : 0;
            return sum + hours;
          }, 0) / respondedRows.length
        : null;

    const disputeRows = disputesByContractor.get(candidate.userId) || [];

    return {
      ...candidate,
      certificationCount: Number(candidate?._count?.certifications || 0),
      requestStats: {
        total: requestRows.length,
        accepted: requestRows.filter((row: any) => row.status === 'accepted').length,
        rejected: requestRows.filter((row: any) => row.status === 'rejected').length,
        pending: requestRows.filter((row: any) => row.status === 'pending').length,
        responded: respondedRows.length,
        responseRate,
        acceptanceRate,
        avgResponseHours,
      },
      disputeStats: {
        total: disputeRows.length,
        open: disputeRows.filter((row: any) => row.status === 'open').length,
        inReview: disputeRows.filter((row: any) => row.status === 'in_review').length,
        resolved: disputeRows.filter((row: any) => row.status === 'resolved').length,
      },
    };
  });

  let overlapTotal = 0;
  let legacyAverageTopScore = 0;
  let v1AverageTopScore = 0;
  let stateMatchRate = 0;
  let v1EligibleProjects = 0;

  for (const project of projects) {
    const legacy = legacyRecommend(project, enrichedCandidates, TOP_N);
    const v1 = matcher.recommend({
      project,
      candidates: enrichedCandidates,
      limit: TOP_N,
    }).matches;

    const legacyIds = new Set(legacy.map((item: any) => item.userId));
    const overlap = v1.filter((item) => legacyIds.has(item.userId)).length;
    overlapTotal += overlap;

    if (legacy[0]) legacyAverageTopScore += Number(legacy[0].matchScore || 0);
    if (v1[0]) v1AverageTopScore += Number(v1[0].matchScore || 0);
    if (v1.length > 0) v1EligibleProjects += 1;

    if (project.state && v1.length > 0) {
      const state = String(project.state || '').toLowerCase();
      const stateMatchCount = v1.filter((item) =>
        String(item.location || '').toLowerCase().includes(state),
      ).length;
      stateMatchRate += stateMatchCount / v1.length;
    }
  }

  const denominator = projects.length || 1;
  const summary = {
    projectsAnalyzed: projects.length,
    candidatesAnalyzed: enrichedCandidates.length,
    topN: TOP_N,
    avgOverlapWithLegacyTopN: Number((overlapTotal / denominator).toFixed(2)),
    avgLegacyTopScore: Number((legacyAverageTopScore / denominator).toFixed(2)),
    avgV1TopScore: Number((v1AverageTopScore / denominator).toFixed(2)),
    v1EligibleProjectRate: Number((v1EligibleProjects / denominator).toFixed(2)),
    avgV1StateMatchRate: Number((stateMatchRate / denominator).toFixed(2)),
  };

  console.log('GC Matching Backtest Summary');
  console.log(JSON.stringify(summary, null, 2));
}

runBacktest()
  .catch((error) => {
    console.error('Backtest failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


/**
 * Stage 6 — free-tier usage limits (server-side; never trusted to the client).
 *
 * Policy (central env configuration, not hardcoded in UI):
 * - PRICE_CHECKER_ANONYMOUS_DAILY_LIMIT     (default 2, rolling 24 h)
 * - PRICE_CHECKER_AUTHENTICATED_DAILY_LIMIT (default 5, rolling 24 h)
 * - PRICE_CHECKER_COUNT_INSUFFICIENT_DATA   (default true — real research spend occurred)
 * - PRICE_CHECKER_IP_DAILY_CAP              (default 6 — abuse backstop per hashed IP)
 *
 * What counts: requests that are currently researching (prevents parallel
 * abuse) plus completed requests whose item was settled as counting toward the
 * allowance. Failed runs and runs cancelled before/during research never count.
 * Answering questions never counts.
 */
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsageStatusDto } from './price-checker.types';

const WINDOW_MS = 24 * 60 * 60 * 1000;

function intEnv(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
}

export interface UsageIdentity {
  userId: string | null;
  anonymousSessionId: string | null;
  ip: string | null;
}

@Injectable()
export class PriceCheckerUsageService {
  constructor(private readonly prisma: PrismaService) {}

  /** In-memory abuse backstop per hashed IP (defence in depth; resets on deploy). */
  private readonly ipStarts = new Map<string, number[]>();

  get countInsufficientData(): boolean {
    return (process.env.PRICE_CHECKER_COUNT_INSUFFICIENT_DATA ?? 'true') !== 'false';
  }

  limitFor(authenticated: boolean): number {
    return authenticated
      ? intEnv('PRICE_CHECKER_AUTHENTICATED_DAILY_LIMIT', 5)
      : intEnv('PRICE_CHECKER_ANONYMOUS_DAILY_LIMIT', 2);
  }

  private hashIp(ip: string): string {
    const salt = process.env.PRICE_CHECKER_IP_HASH_SALT ?? process.env.JWT_SECRET ?? 'bmh-price-checker';
    return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
  }

  ipAllowed(ip: string | null): boolean {
    if (!ip) return true;
    const cap = intEnv('PRICE_CHECKER_IP_DAILY_CAP', 6);
    const key = this.hashIp(ip);
    const now = Date.now();
    const starts = (this.ipStarts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    this.ipStarts.set(key, starts);
    return starts.length < cap;
  }

  recordIpStart(ip: string | null): void {
    if (!ip) return;
    const key = this.hashIp(ip);
    const starts = this.ipStarts.get(key) ?? [];
    starts.push(Date.now());
    this.ipStarts.set(key, starts);
  }

  async usageStatus(identity: UsageIdentity): Promise<UsageStatusDto> {
    const authenticated = Boolean(identity.userId);
    const limit = this.limitFor(authenticated);
    const since = new Date(Date.now() - WINDOW_MS);

    const owner = identity.userId
      ? { userId: identity.userId }
      : { anonymousSessionId: identity.anonymousSessionId ?? '__none__' };

    const counted = await this.prisma.priceResearchRequest.findMany({
      where: {
        ...owner,
        createdAt: { gte: since },
        OR: [{ status: 'researching' }, { items: { some: { countsTowardAllowance: true } } }],
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const used = counted.length;
    return {
      allowed: used < limit && this.ipAllowed(identity.ip),
      limit,
      used,
      remaining: Math.max(0, limit - used),
      authenticated,
      resetsAt: counted.length >= limit && counted[0] ? new Date(counted[0].createdAt.getTime() + WINDOW_MS).toISOString() : null,
    };
  }
}

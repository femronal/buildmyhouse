import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ArtisanListingStatus,
  ListingKind,
  ListingReviewStatus,
  ProfessionalListingStatus,
  ScamReportStatus,
  VendorListingStatus,
  type ListingReview,
  type ScamReport,
} from '@prisma/client';
import { EmailService } from '../email/email.service';
import { isFinishedBmhJob } from '../marketplace/constants/contractor-rating-policy';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';
import type {
  AdminListingReviewQueryDto,
  AdminScamReportQueryDto,
  ListingReviewBodyDto,
  ScamReportBodyDto,
  UpdateScamReportDto,
} from './dto/listing-feedback.dto';
import { listingPublicPath, parseListingKind, resolveListing, type ResolvedListing } from './listing-resolver';
import { isBuildMyHouseUploadUrl } from './upload-url';

const PUBLIC_PAGE = 10;
const ADMIN_PAGE = 20;
const REVIEW_DAILY_LIMIT = 10;
const REPORT_DAILY_LIMIT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEB = 'https://buildmyhouse.app';
const ADMIN_WEB = 'https://admin.buildmyhouse.app';

const REPORT_THANKS = 'Thanks. BMH will look into this privately and may contact you.';
const REVIEW_LIMIT_MESSAGE = 'You have sent a lot of reviews today. Please try again tomorrow.';
const REPORT_LIMIT_MESSAGE = 'You have sent a lot of reports today. Please try again tomorrow.';
const OPEN_REPORT_MESSAGE = 'You already have an open report for this listing.';
const CONSENT_MESSAGE = 'Please agree that BMH can contact you about this report.';

type Actor = { id: string; role?: string | null; email?: string | null };

export type PublicNotice = { text: string; date: string };

export function withPublicNotice<T extends object>(profile: T, notice: PublicNotice | null): T | (T & { bmhNotice: PublicNotice }) {
  if (!notice) return profile;
  return { ...profile, bmhNotice: notice };
}

@Injectable()
export class ListingFeedbackService {
  private readonly logger = new Logger(ListingFeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ws: WebSocketService,
    private readonly email: EmailService,
  ) {}

  async listPublicReviews(kindRaw: string, slug: string, page = 1) {
    const listing = await this.listing(kindRaw, slug);
    const take = PUBLIC_PAGE;
    const skip = (Math.max(1, page) - 1) * take;
    const where = { listingKind: listing.kind, listingId: listing.id, status: ListingReviewStatus.approved };
    const [rows, ratings] = await Promise.all([
      this.prisma.listingReview.findMany({
        where,
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.listingReview.findMany({ where, select: { rating: true } }),
    ]);
    const summary = summaryFrom(ratings.map((row) => row.rating));
    return {
      reviews: rows.map(toPublicReview),
      summary,
      page: Math.max(1, page),
    };
  }

  /** Approved reviews for every public listing of one kind. Pending and hidden listings are omitted. */
  async approvedReviewsBySlug(kindRaw: string) {
    const kind = parseListingKind(kindRaw);
    const rows = await this.prisma.listingReview.findMany({
      where: { listingKind: kind, status: ListingReviewStatus.approved },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const slugs = await this.publicSlugs(kind, [...new Set(rows.map((row) => row.listingId))]);
    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!slugs.has(row.listingId)) continue;
      const list = grouped.get(row.listingId) || [];
      list.push(row);
      grouped.set(row.listingId, list);
    }
    return {
      data: [...grouped.entries()].map(([id, reviews]) => ({
        slug: slugs.get(id) as string,
        summary: summaryFrom(reviews.map((review) => review.rating)),
        reviews: reviews.slice(0, PUBLIC_PAGE).map(toPublicReview),
      })),
    };
  }

  async myReview(kindRaw: string, slug: string, userId: string) {
    const listing = await this.listing(kindRaw, slug);
    const row = await this.prisma.listingReview.findFirst({
      where: { listingKind: listing.kind, listingId: listing.id, userId },
    });
    if (!row) return null;
    return {
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      status: row.status,
      label: reviewLabel(row.verifiedBmhJob),
    };
  }

  async submitReview(kindRaw: string, slug: string, actor: Actor, body: ListingReviewBodyDto) {
    if (actor.role === 'admin') {
      throw new ForbiddenException('Admins do not review listings.');
    }
    const listing = await this.listing(kindRaw, slug);
    await this.assertNotOwner(listing, actor.id);
    await this.assertReviewAllowance(actor.id, listing);
    const proof = await this.verifiedJob(actor.id, listing);
    const title = cleanTitle(body.title);
    const comment = String(body.comment || '').trim();
    const existing = await this.prisma.listingReview.findFirst({
      where: { listingKind: listing.kind, listingId: listing.id, userId: actor.id },
    });
    const data = {
      rating: body.rating,
      title,
      comment,
      verifiedBmhJob: proof.verified,
      projectId: proof.projectId,
      status: ListingReviewStatus.pending,
      moderatedById: null,
      moderatedAt: null,
      rejectionReason: null,
    };
    const saved = existing
      ? await this.prisma.listingReview.update({ where: { id: existing.id }, data })
      : await this.prisma.listingReview.create({
          data: { ...data, listingKind: listing.kind, listingId: listing.id, userId: actor.id },
        });
    await this.notifyAdmins('listing_review', 'Listing review to check', `${listing.displayName} has a review to check.`, {
      href: '/listing-reviews',
    });
    return { id: saved.id, status: saved.status };
  }

  async adminListReviews(query: AdminListingReviewQueryDto) {
    const page = Math.max(1, query.page || 1);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.kind ? { listingKind: query.kind } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.listingReview.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * ADMIN_PAGE,
        take: ADMIN_PAGE,
      }),
      this.prisma.listingReview.count({ where }),
    ]);
    const names = await this.listingNames(rows);
    return {
      data: rows.map((row) => ({
        id: row.id,
        status: row.status,
        listingKind: row.listingKind,
        listingId: row.listingId,
        listingName: names.get(keyOf(row.listingKind, row.listingId))?.name || 'Listing',
        listingPath: names.get(keyOf(row.listingKind, row.listingId))?.path || listingPublicPath(row.listingKind, ''),
        reviewerName: row.user?.fullName || 'BMH user',
        reviewerEmail: row.user?.email || '',
        rating: row.rating,
        title: row.title,
        comment: row.comment,
        label: reviewLabel(row.verifiedBmhJob),
        createdAt: row.createdAt,
      })),
      meta: { page, pageSize: ADMIN_PAGE, total },
    };
  }

  async approveReview(id: string, adminId: string) {
    const row = await this.requireReview(id);
    return this.prisma.listingReview.update({
      where: { id: row.id },
      data: {
        status: ListingReviewStatus.approved,
        moderatedById: adminId,
        moderatedAt: new Date(),
        rejectionReason: null,
      },
    });
  }

  async rejectReview(id: string, adminId: string, reason: string) {
    const clean = String(reason || '').trim();
    if (!clean) throw new BadRequestException('A reason is required.');
    const row = await this.requireReview(id);
    return this.prisma.listingReview.update({
      where: { id: row.id },
      data: {
        status: ListingReviewStatus.rejected,
        moderatedById: adminId,
        moderatedAt: new Date(),
        rejectionReason: clean,
      },
    });
  }

  async submitReport(kindRaw: string, slug: string, actor: Actor, body: ScamReportBodyDto) {
    if (body.contactConsent !== true) throw new BadRequestException(CONSENT_MESSAGE);
    const listing = await this.listing(kindRaw, slug);
    const user = await this.prisma.user.findUnique({
      where: { id: actor.id },
      select: { phone: true },
    });
    const contactPhone = String(body.contactPhone || user?.phone || '').trim();
    if (!contactPhone) {
      throw new BadRequestException('Add a phone number so BMH can contact you about this report.');
    }
    const incidentDate = parseIncidentDate(body.incidentDate);
    const evidenceUrls = this.cleanEvidence(body.evidenceUrls || []);
    const since = new Date(Date.now() - DAY_MS);
    const [recent, open] = await Promise.all([
      this.prisma.scamReport.count({ where: { reporterUserId: actor.id, createdAt: { gte: since } } }),
      this.prisma.scamReport.count({
        where: {
          reporterUserId: actor.id,
          listingKind: listing.kind,
          listingId: listing.id,
          status: { in: [ScamReportStatus.new, ScamReportStatus.investigating] },
        },
      }),
    ]);
    if (recent >= REPORT_DAILY_LIMIT) throw new HttpException(REPORT_LIMIT_MESSAGE, 429);
    if (open >= 1) throw new ConflictException(OPEN_REPORT_MESSAGE);
    const created = await this.prisma.scamReport.create({
      data: {
        listingKind: listing.kind,
        listingId: listing.id,
        reporterUserId: actor.id,
        whatHappened: body.whatHappened.trim(),
        amountNaira: body.amountNaira ?? null,
        incidentDate,
        evidenceUrls,
        contactConsent: true,
        contactPhone,
        status: ScamReportStatus.new,
      },
    });
    await this.notifyAdmins('scam_report', 'New scam report', `${listing.displayName} has a private report.`, {
      href: `/scam-reports/${created.id}`,
    });
    await this.emailAdminsAboutReport(listing, created);
    return { id: created.id, status: 'new' as const, message: REPORT_THANKS };
  }

  async adminListReports(query: AdminScamReportQueryDto) {
    const page = Math.max(1, query.page || 1);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.kind ? { listingKind: query.kind } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.scamReport.findMany({
        where,
        include: { reporter: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * ADMIN_PAGE,
        take: ADMIN_PAGE,
      }),
      this.prisma.scamReport.count({ where }),
    ]);
    const names = await this.listingNames(rows);
    return {
      data: rows.map((row) => {
        const listing = names.get(keyOf(row.listingKind, row.listingId));
        return {
          id: row.id,
          status: row.status,
          listingKind: row.listingKind,
          listingName: listing?.name || 'Listing',
          listingPath: listing?.path || listingPublicPath(row.listingKind, ''),
          amountNaira: row.amountNaira,
          incidentDate: row.incidentDate,
          createdAt: row.createdAt,
          reporterName: row.reporter?.fullName || 'BMH user',
        };
      }),
      meta: { page, pageSize: ADMIN_PAGE, total },
    };
  }

  async adminGetReport(id: string) {
    const row = await this.prisma.scamReport.findUnique({
      where: { id },
      include: { reporter: { select: { fullName: true, email: true, phone: true } } },
    });
    if (!row) throw new NotFoundException('Report not found');
    const names = await this.listingNames([row]);
    const listing = names.get(keyOf(row.listingKind, row.listingId));
    const others = await this.prisma.scamReport.findMany({
      where: { listingKind: row.listingKind, listingId: row.listingId, NOT: { id: row.id } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, createdAt: true, amountNaira: true, whatHappened: true },
    });
    return {
      id: row.id,
      status: row.status,
      listingKind: row.listingKind,
      listingId: row.listingId,
      listingName: listing?.name || 'Listing',
      listingPath: listing?.path || listingPublicPath(row.listingKind, ''),
      whatHappened: row.whatHappened,
      amountNaira: row.amountNaira,
      incidentDate: row.incidentDate,
      evidenceUrls: row.evidenceUrls,
      contactConsent: row.contactConsent,
      contactPhone: row.contactPhone,
      reporter: {
        name: row.reporter?.fullName || 'BMH user',
        email: row.reporter?.email || '',
        phone: row.reporter?.phone || row.contactPhone || '',
      },
      adminNotes: row.adminNotes,
      publicNotice: row.publicNotice,
      assignedAdminId: row.assignedAdminId,
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
      otherReports: others,
    };
  }

  async updateReport(id: string, adminId: string, body: UpdateScamReportDto) {
    void adminId;
    const row = await this.prisma.scamReport.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Report not found');
    const status = body.status || row.status;
    const noticeInput = body.publicNotice !== undefined ? String(body.publicNotice || '').trim() : row.publicNotice;
    const publicNotice = noticeInput ? noticeInput : null;
    if (status === ScamReportStatus.upheld) {
      if (!publicNotice || publicNotice.length < 20 || publicNotice.length > 500) {
        throw new BadRequestException('Write a public notice of 20 to 500 characters before upholding this report.');
      }
    }
    const leavingResolved = status !== ScamReportStatus.upheld && status !== ScamReportStatus.dismissed;
    return this.prisma.scamReport.update({
      where: { id: row.id },
      data: {
        status,
        publicNotice,
        adminNotes: body.adminNotes !== undefined ? String(body.adminNotes || '').trim() || null : row.adminNotes,
        assignedAdminId: body.assignedAdminId !== undefined ? body.assignedAdminId || null : row.assignedAdminId,
        resolvedAt: leavingResolved ? null : row.resolvedAt || new Date(),
      },
    });
  }

  async publicNotice(kindRaw: string, slug: string): Promise<PublicNotice | null> {
    const listing = await resolveListing(this.prisma, parseListingKind(kindRaw), slug);
    const row = await this.prisma.scamReport.findFirst({
      where: {
        listingKind: listing.kind,
        listingId: listing.id,
        status: ScamReportStatus.upheld,
        NOT: { publicNotice: null },
      },
      orderBy: [{ resolvedAt: 'desc' }, { createdAt: 'desc' }],
    });
    const text = String(row?.publicNotice || '').trim();
    if (!row || !text) return null;
    return { text, date: (row.resolvedAt || row.updatedAt || row.createdAt).toISOString() };
  }

  async queueCounts() {
    const [pendingReviews, newReports] = await Promise.all([
      this.prisma.listingReview.count({ where: { status: ListingReviewStatus.pending } }),
      this.prisma.scamReport.count({ where: { status: ScamReportStatus.new } }),
    ]);
    return { pendingReviews, newReports };
  }

  private async listing(kindRaw: string, slug: string) {
    return resolveListing(this.prisma, parseListingKind(kindRaw), slug);
  }

  private async assertNotOwner(listing: ResolvedListing, userId: string) {
    if (listing.ownerUserIds.includes(userId)) {
      throw new ForbiddenException('You cannot review your own listing.');
    }
    if (!listing.contractorIds.length) return;
    const owned = await this.prisma.contractor.findFirst({
      where: { id: { in: listing.contractorIds }, userId },
      select: { id: true },
    });
    if (owned) throw new ForbiddenException('You cannot review your own listing.');
  }

  private async assertReviewAllowance(userId: string, listing: ResolvedListing) {
    const since = new Date(Date.now() - DAY_MS);
    const [recent, existing] = await Promise.all([
      this.prisma.listingReview.count({ where: { userId, createdAt: { gte: since } } }),
      this.prisma.listingReview.findFirst({
        where: { listingKind: listing.kind, listingId: listing.id, userId },
        select: { createdAt: true },
      }),
    ]);
    const editingRecent = !!existing && existing.createdAt >= since;
    if (recent >= REVIEW_DAILY_LIMIT && !editingRecent) {
      throw new HttpException(REVIEW_LIMIT_MESSAGE, 429);
    }
  }

  private async verifiedJob(userId: string, listing: ResolvedListing) {
    if (!listing.contractorUserIds.length) return { verified: false, projectId: null as string | null };
    const projects = await this.prisma.project.findMany({
      where: { homeownerId: userId, generalContractorId: { in: listing.contractorUserIds } },
      select: { id: true, status: true, progress: true },
    });
    const match = projects.find((project) => isFinishedBmhJob(project));
    return match ? { verified: true, projectId: match.id } : { verified: false, projectId: null };
  }

  private cleanEvidence(urls: string[]) {
    const config = {
      bucket: String(this.config.get<string>('AWS_S3_BUCKET') || '').trim(),
      region: String(this.config.get<string>('AWS_REGION') || '').trim(),
      publicBaseUrl: String(this.config.get<string>('AWS_S3_PUBLIC_BASE_URL') || '').trim() || null,
    };
    const clean = urls.map((url) => String(url || '').trim()).filter(Boolean);
    if (clean.length > 10) throw new BadRequestException('You can attach up to 10 files.');
    if (clean.some((url) => !isBuildMyHouseUploadUrl(url, config))) {
      throw new BadRequestException('Upload evidence through BuildMyHouse. Outside links are not accepted.');
    }
    return clean;
  }

  private async publicSlugs(kind: ListingKind, ids: string[]) {
    const map = new Map<string, string>();
    if (!ids.length) return map;
    if (kind === ListingKind.artisan) {
      const rows = await this.prisma.artisanListing.findMany({
        where: { id: { in: ids }, listingStatus: ArtisanListingStatus.listed, archivedAt: null },
        select: { id: true, slug: true },
      });
      for (const row of rows) map.set(row.id, row.slug);
      return map;
    }
    if (kind === ListingKind.vendor) {
      const rows = await this.prisma.vendorProfile.findMany({
        where: { id: { in: ids }, listingStatus: VendorListingStatus.listed, deletedAt: null },
        select: { id: true, slug: true },
      });
      for (const row of rows) map.set(row.id, row.slug);
      return map;
    }
    const rows = await this.prisma.professionalListing.findMany({
      where: { id: { in: ids }, listingStatus: ProfessionalListingStatus.listed, archivedAt: null },
      select: { id: true, slug: true },
    });
    for (const row of rows) map.set(row.id, row.slug);
    return map;
  }

  private async requireReview(id: string) {
    const row = await this.prisma.listingReview.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Review not found');
    return row;
  }

  private async listingNames(rows: Array<{ listingKind: ListingKind; listingId: string }>) {
    const ids = (kind: ListingKind) => rows.filter((row) => row.listingKind === kind).map((row) => row.listingId);
    const [professionals, vendors, artisans] = await Promise.all([
      ids(ListingKind.professional).length
        ? this.prisma.professionalListing.findMany({
            where: { id: { in: ids(ListingKind.professional) } },
            select: { id: true, slug: true, displayName: true },
          })
        : [],
      ids(ListingKind.vendor).length
        ? this.prisma.vendorProfile.findMany({
            where: { id: { in: ids(ListingKind.vendor) } },
            select: { id: true, slug: true, tradingName: true },
          })
        : [],
      ids(ListingKind.artisan).length
        ? this.prisma.artisanListing.findMany({
            where: { id: { in: ids(ListingKind.artisan) } },
            select: { id: true, slug: true, displayName: true },
          })
        : [],
    ]);
    const map = new Map<string, { name: string; path: string }>();
    for (const row of professionals) {
      map.set(keyOf(ListingKind.professional, row.id), {
        name: row.displayName,
        path: listingPublicPath(ListingKind.professional, row.slug),
      });
    }
    for (const row of vendors) {
      map.set(keyOf(ListingKind.vendor, row.id), {
        name: row.tradingName,
        path: listingPublicPath(ListingKind.vendor, row.slug),
      });
    }
    for (const row of artisans) {
      map.set(keyOf(ListingKind.artisan, row.id), {
        name: row.displayName,
        path: listingPublicPath(ListingKind.artisan, row.slug),
      });
    }
    return map;
  }

  private async notifyAdmins(type: string, title: string, message: string, data: Record<string, string>) {
    try {
      await this.ws.sendNotificationToRole('admin', { type, title, message, data });
    } catch (error) {
      this.logger.warn(`Admin notice failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async emailAdminsAboutReport(listing: ResolvedListing, report: ScamReport) {
    const to = this.adminInbox();
    if (!to) return;
    const link = `${WEB}${listingPublicPath(listing.kind, listing.slug)}`;
    const queue = `${ADMIN_WEB}/scam-reports/${report.id}`;
    const amount = report.amountNaira == null ? 'Not stated' : String(report.amountNaira);
    const date = report.incidentDate ? report.incidentDate.toISOString().slice(0, 10) : 'Not stated';
    const subject = `New scam report: ${listing.displayName.replace(/[\r\n]+/g, ' ').slice(0, 120)}`;
    const text = [
      `Listing: ${listing.displayName}`,
      `Kind: ${listing.kind}`,
      `Link: ${link}`,
      `Amount in naira: ${amount}`,
      `Date: ${date}`,
      `Admin queue: ${queue}`,
    ].join('\n');
    try {
      await this.email.send({
        to,
        subject,
        text,
        html: `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`,
      });
    } catch (error) {
      this.logger.warn(`Scam report email failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private adminInbox(): string | null {
    const raw =
      this.config.get<string>('ADMIN_NOTIFY_EMAIL') ||
      this.config.get<string>('ADMIN_DASHBOARD_ALLOWED_EMAILS') ||
      this.config.get<string>('ADMIN_ALLOWED_EMAILS') ||
      'admin@buildmyhouse.com';
    const first = String(raw || '')
      .split(',')
      .map((part) => part.trim())
      .find(Boolean);
    return first || null;
  }
}

function summaryFrom(ratings: number[]) {
  if (!ratings.length) return { average: null as number | null, count: 0 };
  const total = ratings.reduce((sum, value) => sum + value, 0);
  return { average: Math.round((total / ratings.length) * 10) / 10, count: ratings.length };
}

function toPublicReview(row: ListingReview & { user?: { fullName: string } | null }) {
  return {
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    label: reviewLabel(row.verifiedBmhJob),
    reviewerName: publicName(row.user?.fullName),
    dateLabel: monthYear(row.createdAt),
    publishedAt: row.createdAt.toISOString().slice(0, 10),
  };
}

function reviewLabel(verified: boolean) {
  return verified ? 'Verified BMH job' : 'Community review';
}

function publicName(fullName?: string | null) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'BMH user';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1).toUpperCase()}.`;
}

function monthYear(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function cleanTitle(value?: string | null) {
  const title = String(value || '').trim();
  return title ? title.slice(0, 80) : null;
}

function parseIncidentDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Enter a real date.');
  const today = lagosDay(new Date());
  if (lagosDay(date) > today) throw new BadRequestException('The incident date cannot be in the future.');
  return date;
}

function lagosDay(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(date);
}

function keyOf(kind: ListingKind, id: string) {
  return `${kind}:${id}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

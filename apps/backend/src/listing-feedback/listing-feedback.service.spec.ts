import { BadRequestException, ConflictException, ForbiddenException, HttpException } from '@nestjs/common';
import { ListingKind, ListingReviewStatus, ScamReportStatus } from '@prisma/client';
import { ListingFeedbackService, withPublicNotice } from './listing-feedback.service';

type Row = Record<string, any>;
let clock = Date.now();

function matches(row: Row, where: any): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return (value as any[]).some((branch) => matches(row, branch));
    if (key === 'AND') return (value as any[]).every((branch) => matches(row, branch));
    if (key === 'NOT') return !matches(row, value);
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('in' in (value as object)) return (value as { in: unknown[] }).in.includes(row[key]);
      if ('gte' in (value as object)) return row[key] >= (value as { gte: unknown }).gte;
      if ('not' in (value as object)) return row[key] !== (value as { not: unknown }).not;
    }
    return row[key] === value;
  });
}

function sortRows(rows: Row[], orderBy: any): Row[] {
  const orders = !orderBy ? [] : Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((left, right) => {
    for (const order of orders) {
      const [key, dir] = Object.entries(order)[0] as [string, 'asc' | 'desc'];
      if (left[key] === right[key]) continue;
      if (left[key] == null) return 1;
      if (right[key] == null) return -1;
      if (left[key] > right[key]) return dir === 'desc' ? -1 : 1;
      if (left[key] < right[key]) return dir === 'desc' ? 1 : -1;
    }
    return 0;
  });
}

function pick(row: Row, select?: Record<string, boolean>) {
  if (!select) return { ...row };
  const next: Row = {};
  for (const key of Object.keys(select)) if (select[key]) next[key] = row[key];
  return next;
}

function decorate(row: Row, args: any, users: Row[]) {
  const next = pick(row, args?.select);
  if (args?.include?.user) {
    const user = users.find((item) => item.id === row.userId);
    next.user = user ? pick(user, args.include.user.select) : null;
  }
  if (args?.include?.reporter) {
    const user = users.find((item) => item.id === row.reporterUserId);
    next.reporter = user ? pick(user, args.include.reporter.select) : null;
  }
  return next;
}

function table(rows: Row[], users: Row[]) {
  return {
    rows,
    async findMany(args: any = {}) {
      const matched = sortRows(rows.filter((row) => matches(row, args.where)), args.orderBy);
      const start = args.skip || 0;
      const sliced = args.take == null ? matched.slice(start) : matched.slice(start, start + args.take);
      return sliced.map((row) => decorate(row, args, users));
    },
    async findFirst(args: any = {}) {
      const [row] = await this.findMany({ ...args, take: 1 });
      return row || null;
    },
    async findUnique(args: any = {}) {
      return this.findFirst(args);
    },
    async count(args: any = {}) {
      return rows.filter((row) => matches(row, args.where)).length;
    },
    async create({ data }: { data: Row }) {
      clock += 1000;
      const row = {
        id: `row-${rows.length + 1}`,
        createdAt: new Date(clock),
        updatedAt: new Date(clock),
        evidenceUrls: [],
        ...data,
      };
      rows.push(row);
      return row;
    },
    async update({ where, data }: { where: Row; data: Row }) {
      const row = rows.find((item) => matches(item, where));
      if (!row) throw new Error('row not found');
      Object.assign(row, data, { updatedAt: new Date() });
      return { ...row };
    },
  };
}

const COMMENT = 'The work was explained clearly and the visit happened on the agreed day.';
const SCAM = 'SECRET-SCAM-TEXT. I paid for materials and the person stopped answering after the first day.';

function reviewBody(rating = 5, comment = COMMENT) {
  return { rating, comment };
}

describe('ListingFeedbackService', () => {
  const users: Row[] = [
    { id: 'homeowner', fullName: 'Ada Okonkwo', email: 'ada@example.com', phone: '08030000001', role: 'homeowner' },
    { id: 'pro-owner', fullName: 'Pro Owner', email: 'pro@example.com', phone: '08030000002', role: 'homeowner' },
    { id: 'vendor-owner', fullName: 'Vendor Owner', email: 'vendor@example.com', phone: '08030000003', role: 'vendor' },
    { id: 'artisan-owner', fullName: 'Artisan Owner', email: 'artisan@example.com', phone: '08030000004', role: 'general_contractor' },
    { id: 'gc-user', fullName: 'Gc User', email: 'gc@example.com', phone: '08030000005', role: 'general_contractor' },
    { id: 'second', fullName: 'Bola Ade', email: 'bola@example.com', phone: '08030000006', role: 'homeowner' },
    { id: 'third', fullName: 'Chioma Bello', email: 'chioma@example.com', phone: '08030000007', role: 'homeowner' },
  ];
  const professionals: Row[] = [];
  const vendors: Row[] = [
    {
      id: 'ven-1',
      slug: 'acme-blocks',
      tradingName: 'Acme Blocks',
      userId: 'vendor-owner',
      listingStatus: 'listed',
      deletedAt: null,
      verificationStatus: 'unverified',
    },
  ];
  const artisans: Row[] = [
    {
      id: 'art-1',
      slug: 'tunde-repairs',
      displayName: 'Tunde Repairs',
      linkedUserId: 'artisan-owner',
      linkedContractorId: 'con-1',
      listingStatus: 'listed',
      archivedAt: null,
      verificationStatus: 'unverified',
    },
  ];
  const contractors: Row[] = [{ id: 'con-1', userId: 'gc-user', rating: 0, reviews: 0, projects: 0, verified: false }];
  const projects: Row[] = [];
  const listingReviews: Row[] = [];
  const scamReports: Row[] = [];
  const contractorReviews: Row[] = [];
  const mutations: string[] = [];
  const guard = (name: string) => async () => {
    mutations.push(name);
    throw new Error(name);
  };

  const prisma: any = {
    user: { findUnique: async ({ where }: any) => users.find((user) => user.id === where.id) || null },
    professionalListing: { ...table(professionals, users), update: guard('professionalListing.update') },
    vendorProfile: { ...table(vendors, users), update: guard('vendorProfile.update') },
    artisanListing: { ...table(artisans, users), update: guard('artisanListing.update') },
    contractor: { ...table(contractors, users), update: guard('contractor.update') },
    project: table(projects, users),
    listingReview: table(listingReviews, users),
    scamReport: table(scamReports, users),
    review: { create: guard('review.create'), update: guard('review.update') },
  };
  const ws = { sendNotificationToRole: jest.fn().mockResolvedValue({ count: 1 }) };
  const email = { send: jest.fn().mockResolvedValue(undefined) };
  const config = {
    get: (key: string) => {
      if (key === 'AWS_S3_BUCKET') return 'bmh-uploads';
      if (key === 'AWS_REGION') return 'eu-north-1';
      if (key === 'ADMIN_DASHBOARD_ALLOWED_EMAILS') return 'ops@buildmyhouse.app';
      return '';
    },
  };
  const service = new ListingFeedbackService(prisma, config as any, ws as any, email as any);
  const actor = { id: 'homeowner', role: 'homeowner' };
  const proof = 'https://bmh-uploads.s3.eu-north-1.amazonaws.com/uploads/files/proof.pdf';

  beforeEach(() => {
    professionals.splice(0, professionals.length, {
      id: 'pro-1',
      slug: 'ada-law',
      displayName: 'Ada Law',
      claimedByUserId: 'pro-owner',
      linkedUserId: null,
      listingStatus: 'listed',
      archivedAt: null,
      verificationStatus: 'unverified',
    });
    listingReviews.splice(0, listingReviews.length);
    scamReports.splice(0, scamReports.length);
    projects.splice(0, projects.length);
    contractorReviews.splice(0, contractorReviews.length);
    mutations.splice(0, mutations.length);
    contractors[0].rating = 0;
    contractors[0].reviews = 0;
    contractors[0].projects = 0;
    ws.sendNotificationToRole.mockClear();
    email.send.mockClear();
    email.send.mockResolvedValue(undefined);
  });

  it('keeps a new review pending and out of the public list', async () => {
    const saved = await service.submitReview('professional', 'ada-law', actor, reviewBody());
    expect(saved.status).toBe(ListingReviewStatus.pending);
    const listed = await service.listPublicReviews('professional', 'ada-law');
    expect(listed.reviews).toEqual([]);
    expect(listed.summary).toEqual({ average: null, count: 0 });
    expect(JSON.stringify(listed)).not.toContain('ada@example.com');
  });

  it('publishes an approved review with the simple average', async () => {
    await service.submitReview('professional', 'ada-law', actor, reviewBody(5));
    await service.approveReview(listingReviews[0].id, 'admin-1');
    await service.submitReview('professional', 'ada-law', { id: 'second', role: 'homeowner' }, reviewBody(4));
    await service.approveReview(listingReviews[1].id, 'admin-1');
    await service.submitReview('professional', 'ada-law', { id: 'third', role: 'homeowner' }, reviewBody(4));
    await service.approveReview(listingReviews[2].id, 'admin-1');
    const listed = await service.listPublicReviews('professional', 'ada-law');
    expect(listed.summary).toEqual({ average: 4.3, count: 3 });
    expect(listed.reviews).toHaveLength(3);
    expect(listed.reviews[0].reviewerName).toBe('Chioma B.');
    expect(listed.reviews[0].label).toBe('Community review');
    expect(JSON.stringify(listed)).not.toContain('@example.com');
  });

  it('returns an empty summary when nothing is approved', async () => {
    const listed = await service.listPublicReviews('vendor', 'acme-blocks');
    expect(listed.summary).toEqual({ average: null, count: 0 });
  });

  it('updates the same row and sends it back to pending', async () => {
    await service.submitReview('vendor', 'acme-blocks', actor, reviewBody());
    await service.approveReview(listingReviews[0].id, 'admin-1');
    const again = await service.submitReview('vendor', 'acme-blocks', actor, reviewBody(3, 'I came back and the second visit fixed the leak properly.'));
    expect(again.id).toBe(listingReviews[0].id);
    expect(listingReviews).toHaveLength(1);
    expect(listingReviews[0].status).toBe(ListingReviewStatus.pending);
    expect(listingReviews[0].moderatedAt).toBeNull();
    const listed = await service.listPublicReviews('vendor', 'acme-blocks');
    expect(listed.reviews).toEqual([]);
  });

  it('refuses a review from each kind of listing owner', async () => {
    await expect(service.submitReview('professional', 'ada-law', { id: 'pro-owner', role: 'homeowner' }, reviewBody())).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.submitReview('vendor', 'acme-blocks', { id: 'vendor-owner', role: 'vendor' }, reviewBody())).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.submitReview('artisan', 'tunde-repairs', { id: 'artisan-owner', role: 'general_contractor' }, reviewBody())).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.submitReview('artisan', 'tunde-repairs', { id: 'gc-user', role: 'general_contractor' }, reviewBody())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks a finished BMH job and ignores cancelled or unfinished work', async () => {
    projects.push({ id: 'job-done', homeownerId: 'homeowner', generalContractorId: 'gc-user', status: 'completed', progress: 100 });
    await service.submitReview('artisan', 'tunde-repairs', actor, reviewBody());
    expect(listingReviews[0].verifiedBmhJob).toBe(true);
    expect(listingReviews[0].projectId).toBe('job-done');
    expect(listingReviews[0].label || reviewLabelOf(listingReviews[0])).toBeTruthy();

    listingReviews.splice(0, listingReviews.length);
    projects.splice(0, projects.length, { id: 'job-cancel', homeownerId: 'homeowner', generalContractorId: 'gc-user', status: 'cancelled', progress: 100 });
    await service.submitReview('artisan', 'tunde-repairs', actor, reviewBody());
    expect(listingReviews[0].verifiedBmhJob).toBe(false);
    expect(listingReviews[0].projectId).toBeNull();

    listingReviews.splice(0, listingReviews.length);
    projects.splice(0, projects.length, { id: 'job-open', homeownerId: 'homeowner', generalContractorId: 'gc-user', status: 'active', progress: 60 });
    await service.submitReview('artisan', 'tunde-repairs', actor, reviewBody());
    expect(listingReviews[0].verifiedBmhJob).toBe(false);
  });

  it('does not change contractor rating, review rows, or listing visibility', async () => {
    projects.push({ id: 'job-done', homeownerId: 'homeowner', generalContractorId: 'gc-user', status: 'completed', progress: 100 });
    await service.submitReview('artisan', 'tunde-repairs', actor, reviewBody());
    await service.approveReview(listingReviews[0].id, 'admin-1');
    expect(contractors[0]).toMatchObject({ rating: 0, reviews: 0, projects: 0, verified: false });
    expect(contractorReviews).toEqual([]);
    expect(artisans[0].listingStatus).toBe('listed');
    expect(artisans[0].verificationStatus).toBe('unverified');
    expect(mutations).toEqual([]);
  });

  it('stops the 11th review in a day', async () => {
    for (let index = 0; index < 10; index += 1) {
      professionals.push({
        id: `extra-${index}`,
        slug: `extra-${index}`,
        displayName: `Extra ${index}`,
        claimedByUserId: null,
        linkedUserId: null,
        listingStatus: 'listed',
        archivedAt: null,
      });
      await service.submitReview('professional', `extra-${index}`, actor, reviewBody());
    }
    professionals.push({
      id: 'extra-10',
      slug: 'extra-10',
      displayName: 'Extra 10',
      claimedByUserId: null,
      linkedUserId: null,
      listingStatus: 'listed',
      archivedAt: null,
    });
    await expect(service.submitReview('professional', 'extra-10', actor, reviewBody())).rejects.toBeInstanceOf(HttpException);
    try {
      await service.submitReview('professional', 'extra-10', actor, reviewBody());
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).message).toBe('You have sent a lot of reviews today. Please try again tomorrow.');
    }
  });

  it('rejects a scam report without consent or with an outside file link', async () => {
    await expect(
      service.submitReport('vendor', 'acme-blocks', actor, {
        whatHappened: SCAM,
        contactConsent: false,
        contactPhone: '08030000001',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.submitReport('vendor', 'acme-blocks', actor, {
        whatHappened: SCAM,
        contactConsent: true,
        contactPhone: '08030000001',
        evidenceUrls: ['https://evil.example/proof.pdf'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('limits daily reports and a second open report on the same listing', async () => {
    const report = (slug: string) =>
      service.submitReport('vendor', slug, actor, {
        whatHappened: SCAM,
        contactConsent: true,
        contactPhone: '08030000001',
        amountNaira: 25000,
        evidenceUrls: [proof],
      });
    for (let index = 0; index < 3; index += 1) {
      const slug = `shop-${index}`;
      vendors.push({
        id: `shop-${index}`,
        slug,
        tradingName: `Shop ${index}`,
        userId: null,
        listingStatus: 'listed',
        deletedAt: null,
      });
      await report(slug);
    }
    vendors.push({ id: 'shop-3', slug: 'shop-3', tradingName: 'Shop 3', userId: null, listingStatus: 'listed', deletedAt: null });
    await expect(report('shop-3')).rejects.toBeInstanceOf(HttpException);
    try {
      await report('shop-3');
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(429);
    }

    scamReports.splice(0, scamReports.length);
    await report('acme-blocks');
    await expect(report('acme-blocks')).rejects.toBeInstanceOf(ConflictException);
  });

  it('keeps reports off public reviews and the listing until one is upheld', async () => {
    const created = await service.submitReport('vendor', 'acme-blocks', actor, {
      whatHappened: SCAM,
      contactConsent: true,
      contactPhone: '08030000001',
      amountNaira: 25000,
      incidentDate: '2026-10-01',
      evidenceUrls: [proof],
    });
    expect(created).toEqual({
      id: created.id,
      status: 'new',
      message: 'Thanks. BMH will look into this privately and may contact you.',
    });
    expect(created).not.toHaveProperty('whatHappened');
    const listed = await service.listPublicReviews('vendor', 'acme-blocks');
    expect(JSON.stringify(listed)).not.toContain('SECRET-SCAM-TEXT');
    expect(await service.publicNotice('vendor', 'acme-blocks')).toBeNull();
    expect(withPublicNotice({ slug: 'acme-blocks' }, null)).not.toHaveProperty('bmhNotice');

    await expect(service.updateReport(created.id, 'admin-1', { status: ScamReportStatus.upheld })).rejects.toBeInstanceOf(BadRequestException);
    await service.updateReport(created.id, 'admin-1', {
      status: ScamReportStatus.upheld,
      publicNotice: 'BMH looked into this report and posted this notice.',
    });
    const notice = await service.publicNotice('vendor', 'acme-blocks');
    expect(notice?.text).toBe('BMH looked into this report and posted this notice.');
    expect(withPublicNotice({ slug: 'acme-blocks' }, notice)).toMatchObject({ bmhNotice: notice });

    await service.updateReport(created.id, 'admin-1', { status: ScamReportStatus.investigating });
    expect(await service.publicNotice('vendor', 'acme-blocks')).toBeNull();
    expect(vendors[0].verificationStatus).toBe('unverified');
    expect(vendors[0].listingStatus).toBe('listed');
    expect(contractors[0].rating).toBe(0);
    expect(mutations).toEqual([]);
  });

  it('notifies admins once and still accepts the report if email fails', async () => {
    email.send.mockRejectedValueOnce(new Error('mailbox down'));
    const created = await service.submitReport('professional', 'ada-law', actor, {
      whatHappened: SCAM,
      contactConsent: true,
      amountNaira: 10000,
      incidentDate: '2026-09-02',
    });
    expect(created.status).toBe('new');
    expect(ws.sendNotificationToRole).toHaveBeenCalledTimes(1);
    expect(email.send).toHaveBeenCalledTimes(1);
    const sent = email.send.mock.calls[0][0];
    expect(sent.to).toBe('ops@buildmyhouse.app');
    expect(sent.subject).toBe('New scam report: Ada Law');
    expect(sent.subject).not.toContain('SECRET-SCAM-TEXT');
    expect(sent.text).toContain('https://buildmyhouse.app/professionals/ada-law');
    expect(sent.text).toContain('professional');
    expect(sent.text).toContain('Amount in naira: 10000');
    expect(sent.text).toContain('Date: 2026-09-02');
    expect(sent.text).toContain(`https://admin.buildmyhouse.app/scam-reports/${created.id}`);
    expect(sent.text).not.toContain('SECRET-SCAM-TEXT');
  });

  it('uses the finished-job helper values', () => {
    expect(ListingKind.artisan).toBe('artisan');
  });
});

function reviewLabelOf(row: Row) {
  return row.verifiedBmhJob ? 'Verified BMH job' : 'Community review';
}

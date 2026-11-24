import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminAccessPermissionsService } from '../admin-access/admin-access-permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildPartnershipCounts } from './partnership-metrics';
import {
  DAILY_FIRST_OUTREACH_CAP,
  allowedStageMoves,
  canMoveStage,
  dateOnlyIso,
  daysSinceLastContact,
  effectiveDueIso,
  findDuplicate,
  followUpStatus,
  isBeforeConversationBooked,
  lagosDateIso,
  lagosTodayIso,
  lagosWeekday,
  nextStep,
  nextStepText,
  normaliseCompanyName,
  normaliseDomain,
  normaliseEmail,
  nurtureCheckDue,
  playbookDueIso,
  toE164Nigeria,
} from './partnership-math';
import { mapSheet, type MappedSheetRow } from './sheet-import';

const PLAYBOOK_KINDS = new Set(['first_outreach', 'authority_proof', 'utility', 'close_the_loop', 'nurture']);
const INSPECT_MAILBOX = 'inspect@buildmyhouse.app';

type Tx = Prisma.TransactionClient;
type Flags = { view: boolean; edit: boolean; manage: boolean };

@Injectable()
export class PartnershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: AdminAccessPermissionsService,
  ) {}

  async list(userId: string, query: { q?: string; stage?: string; status?: string; category?: string; ownerId?: string; includeArchived?: boolean }) {
    await this.assertView(userId);
    const leads = await this.prisma.partnershipLead.findMany({
      where: {
        ...(query.includeArchived ? {} : { archivedAt: null }),
        ...(query.stage ? { stage: query.stage as never } : {}),
        ...(query.category ? { category: query.category as never } : {}),
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      },
      include: { contacts: true, owner: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const today = lagosTodayIso(new Date());
    const needle = (query.q || '').trim().toLowerCase();
    return leads
      .map((lead) => this.present(lead, today))
      .filter((lead) => !query.status || this.statusMatches(lead.followUpStatus, lead.stage, query.status))
      .filter((lead) => {
        if (!needle) return true;
        const contactText = lead.contacts.map((contact) => `${contact.fullName} ${contact.email || ''}`).join(' ');
        return `${lead.leadRef} ${lead.companyName} ${lead.groupName || ''} ${contactText}`.toLowerCase().includes(needle);
      });
  }

  async get(userId: string, id: string) {
    const flags = await this.assertView(userId);
    const lead = await this.loadLead(id);
    const today = lagosTodayIso(new Date());
    const presented = this.present(lead, today);
    const facts = this.factsFor(lead, flags.manage);
    const [audits, partner] = await Promise.all([
      this.prisma.partnershipAuditLog.findMany({ where: { entity: 'lead', entityId: id }, orderBy: { at: 'desc' } }),
      this.partnerPanel(lead),
    ]);
    return {
      ...presented,
      touches: [...lead.touches].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()),
      meetings: lead.meetings,
      stageChanges: lead.stageChanges,
      audits,
      partner,
      allowedMoves: allowedStageMoves(lead.stage).filter((stage) => canMoveStage(lead.stage, stage, facts).ok),
      canEdit: this.canChange(flags, lead.ownerId, userId),
      readOnlyReason: this.canChange(flags, lead.ownerId, userId) ? null : `Owned by ${lead.owner.fullName}. Only the owner or a Partnerships Admin can change it.`,
    };
  }

  async create(userId: string, input: Record<string, any>) {
    const flags = await this.assertEdit(userId);
    const ownerId = flags.manage && input.ownerId ? String(input.ownerId) : userId;
    if (ownerId !== userId) {
      const canOwn = await this.permissions.userHasPermission(ownerId, 'partnerships.edit');
      if (!canOwn) throw new BadRequestException('Pick an owner who can edit partner leads.');
    }
    const companyName = String(input.companyName || '').trim();
    if (!companyName) throw new BadRequestException('Enter the company name.');
    const email = normaliseEmail(input.contact?.email);
    const domain = normaliseDomain(input.website);
    await this.refuseDuplicate({ email, domain, companyName, createAnyway: input.createAnyway, reason: input.reason, userId });
    return this.prisma.$transaction(async (tx) => {
      const leadRef = await this.nextLeadRef(tx);
      const lead = await tx.partnershipLead.create({
        data: {
          leadRef,
          companyName,
          companyNameNormalised: normaliseCompanyName(companyName),
          category: input.category,
          website: input.website?.trim() || null,
          websiteDomain: domain,
          city: blank(input.city),
          state: blank(input.state),
          whyTheyMatter: blank(input.whyTheyMatter),
          whatWeKnow: blank(input.whatWeKnow),
          suspectedProblem: blank(input.suspectedProblem),
          exactNextAction: blank(input.exactNextAction),
          groupName: input.category === 'diaspora_group' ? blank(input.groupName) : blank(input.groupName),
          temperature: input.temperature || null,
          sourceType: input.sourceType,
          sourceDetail: blank(input.sourceDetail),
          sourceUrl: blank(input.sourceUrl),
          ownerId,
          createdById: userId,
          stage: 'researching',
          followUpStep: 'day_0',
        },
      });
      if (input.contact?.fullName || email || input.contact?.phone) {
        await tx.partnershipContact.create({
          data: {
            leadId: lead.id,
            fullName: String(input.contact?.fullName || companyName).trim(),
            position: blank(input.contact?.position),
            email,
            emailNormalised: email,
            phone: toE164Nigeria(input.contact?.phone),
            whatsapp: toE164Nigeria(input.contact?.whatsapp),
            linkedinUrl: blank(input.contact?.linkedinUrl),
            isDecisionMaker: Boolean(input.contact?.isDecisionMaker),
            isPrimary: true,
          },
        });
      }
      await this.audit(tx, { entityId: lead.id, action: input.createAnyway ? 'create' : 'create', actorId: userId, before: null, after: { leadRef, companyName, ownerId, reason: input.createAnyway ? input.reason : undefined } });
      return tx.partnershipLead.findUniqueOrThrow({ where: { id: lead.id }, include: leadInclude });
    });
  }

  async update(userId: string, id: string, input: Record<string, any>) {
    const lead = await this.loadLead(id);
    const flags = await this.assertCanChangeLead(userId, lead);
    if (input.ownerId && input.ownerId !== lead.ownerId && !flags.manage) {
      throw new ForbiddenException('You can only change leads you own.');
    }
    const data: Prisma.PartnershipLeadUpdateInput = {};
    if (input.companyName != null) {
      data.companyName = String(input.companyName).trim();
      data.companyNameNormalised = normaliseCompanyName(String(input.companyName));
    }
    for (const key of ['city', 'state', 'whyTheyMatter', 'whatWeKnow', 'suspectedProblem', 'exactNextAction', 'groupName', 'website'] as const) {
      if (input[key] !== undefined) (data as any)[key] = blank(input[key]);
    }
    if (input.website !== undefined) data.websiteDomain = normaliseDomain(input.website);
    if (input.category) data.category = input.category;
    if (input.temperature !== undefined) data.temperature = input.temperature || null;
    if (input.nextFollowUpOverride !== undefined) {
      data.nextFollowUpOverride = input.nextFollowUpOverride ? new Date(`${String(input.nextFollowUpOverride).slice(0, 10)}T00:00:00.000Z`) : null;
    }
    if (input.ownerId && flags.manage) data.owner = { connect: { id: input.ownerId } };
    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.partnershipLead.update({ where: { id }, data });
      await this.audit(tx, {
        entityId: id,
        action: input.ownerId && input.ownerId !== lead.ownerId ? 'reassign' : 'update',
        actorId: userId,
        before: this.snapshot(lead),
        after: this.snapshot(saved),
      });
      return saved;
    });
    return updated;
  }

  async changeStage(userId: string, id: string, input: { toStage: string; reason?: string }) {
    const lead = await this.loadLead(id);
    const flags = await this.assertCanChangeLead(userId, lead);
    const facts = this.factsFor(lead, flags.manage, input.reason);
    const check = canMoveStage(lead.stage, input.toStage, facts);
    if (!check.ok) throw new BadRequestException(check.message);
    return this.prisma.$transaction(async (tx) => {
      await this.moveStage(tx, lead, input.toStage, facts, { userId, reason: input.reason });
      return tx.partnershipLead.findUniqueOrThrow({ where: { id } });
    });
  }

  async archive(userId: string, id: string) {
    await this.assertManage(userId);
    const lead = await this.loadLead(id);
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.partnershipLead.update({ where: { id }, data: { archivedAt: new Date() } });
      await this.audit(tx, { entityId: id, action: 'archive', actorId: userId, before: this.snapshot(lead), after: this.snapshot(saved) });
      return saved;
    });
  }

  async addContact(userId: string, leadId: string, input: Record<string, any>) {
    const lead = await this.loadLead(leadId);
    await this.assertCanChangeLead(userId, lead);
    const email = normaliseEmail(input.email);
    await this.refuseDuplicate({ email, ignoreLeadId: leadId, companyName: null, domain: null, createAnyway: false, reason: null, userId });
    return this.prisma.$transaction(async (tx) => {
      if (input.isPrimary) await tx.partnershipContact.updateMany({ where: { leadId }, data: { isPrimary: false } });
      const contact = await tx.partnershipContact.create({
        data: {
          leadId,
          fullName: String(input.fullName || '').trim(),
          position: blank(input.position),
          email,
          emailNormalised: email,
          phone: toE164Nigeria(input.phone),
          whatsapp: toE164Nigeria(input.whatsapp),
          linkedinUrl: blank(input.linkedinUrl),
          isDecisionMaker: Boolean(input.isDecisionMaker),
          isPrimary: Boolean(input.isPrimary),
          doNotContact: Boolean(input.doNotContact),
          doNotContactReason: blank(input.doNotContactReason),
        },
      });
      await this.audit(tx, { entityId: leadId, action: 'update', actorId: userId, before: null, after: { contactId: contact.id, email } });
      return contact;
    });
  }

  async updateContact(userId: string, contactId: string, input: Record<string, any>) {
    const contact = await this.prisma.partnershipContact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('This contact was not found.');
    const lead = await this.loadLead(contact.leadId);
    await this.assertCanChangeLead(userId, lead);
    const email = input.email !== undefined ? normaliseEmail(input.email) : contact.emailNormalised;
    if (email && email !== contact.emailNormalised) {
      await this.refuseDuplicate({ email, ignoreLeadId: lead.id, companyName: null, domain: null, createAnyway: false, reason: null, userId });
    }
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.partnershipContact.update({
        where: { id: contactId },
        data: {
          ...(input.fullName != null ? { fullName: String(input.fullName).trim() } : {}),
          ...(input.position !== undefined ? { position: blank(input.position) } : {}),
          ...(input.email !== undefined ? { email, emailNormalised: email } : {}),
          ...(input.phone !== undefined ? { phone: toE164Nigeria(input.phone) } : {}),
          ...(input.whatsapp !== undefined ? { whatsapp: toE164Nigeria(input.whatsapp) } : {}),
          ...(input.linkedinUrl !== undefined ? { linkedinUrl: blank(input.linkedinUrl) } : {}),
          ...(input.isDecisionMaker !== undefined ? { isDecisionMaker: Boolean(input.isDecisionMaker) } : {}),
          ...(input.isPrimary !== undefined ? { isPrimary: Boolean(input.isPrimary) } : {}),
          ...(input.doNotContact !== undefined ? { doNotContact: Boolean(input.doNotContact) } : {}),
          ...(input.doNotContactReason !== undefined ? { doNotContactReason: blank(input.doNotContactReason) } : {}),
        },
      });
      await this.audit(tx, { entityId: lead.id, action: 'update', actorId: userId, before: { contactId, email: contact.emailNormalised }, after: { contactId, email: saved.emailNormalised, doNotContact: saved.doNotContact } });
      return saved;
    });
  }

  async logTouch(userId: string, leadId: string, input: Record<string, any>) {
    const lead = await this.loadLead(leadId);
    const flags = await this.assertCanChangeLead(userId, lead);
    const occurredAt = new Date(input.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) throw new BadRequestException('Enter when this follow-up happened.');
    if (occurredAt.getTime() > Date.now()) throw new BadRequestException('Future times are blocked.');
    const contact = input.contactId ? lead.contacts.find((item) => item.id === input.contactId) : lead.contacts.find((item) => item.isPrimary) || lead.contacts[0];
    if (contact?.doNotContact) throw new BadRequestException('This contact is marked do not contact.');
    return this.prisma.$transaction(async (tx) => {
      let warning: string | null = null;
      if (input.kind === 'first_outreach') {
        const cap = await this.outreachCount(tx, lead.ownerId, lagosDateIso(occurredAt));
        if (cap >= DAILY_FIRST_OUTREACH_CAP) {
          if (!(flags.manage && input.override && String(input.reason || '').trim())) {
            throw new BadRequestException('A 3rd needs a Partnerships Admin.');
          }
          warning = 'A Partnerships Admin allowed this outreach past the daily cap.';
        } else if (cap + 1 === DAILY_FIRST_OUTREACH_CAP) {
          warning = '2 of 2 new outreach used today. A 3rd needs a Partnerships Admin.';
        }
      }
      const saved = await this.writeTouch(tx, lead, userId, input, occurredAt, false);
      const outreachUsed = await this.outreachCount(tx, lead.ownerId, lagosDateIso(occurredAt));
      return { ...saved, warning, outreachUsed, outreachLeft: Math.max(0, DAILY_FIRST_OUTREACH_CAP - outreachUsed) };
    });
  }

  async addMeeting(userId: string, leadId: string, input: Record<string, any>) {
    const lead = await this.loadLead(leadId);
    await this.assertCanChangeLead(userId, lead);
    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('Enter when the meeting starts.');
    return this.prisma.$transaction(async (tx) => {
      const meeting = await tx.partnershipMeeting.create({
        data: {
          leadId,
          contactId: input.contactId || null,
          startsAt,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          meetLink: blank(input.meetLink),
          status: 'booked',
          bookedById: userId,
        },
      });
      if (isBeforeConversationBooked(lead.stage)) {
        await this.moveStage(tx, lead, 'conversation_booked', { ...this.factsFor(lead, false), hasMeeting: true }, { userId: null, reason: 'Meeting booked' });
      }
      await this.audit(tx, { entityId: leadId, action: 'update', actorId: userId, before: null, after: { meetingId: meeting.id, startsAt: startsAt.toISOString() } });
      return meeting;
    });
  }

  async updateMeeting(userId: string, meetingId: string, input: { status?: string; outcome?: string }) {
    const meeting = await this.prisma.partnershipMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('This meeting was not found.');
    const lead = await this.loadLead(meeting.leadId);
    await this.assertCanChangeLead(userId, lead);
    if (input.status === 'held' && meeting.startsAt.getTime() > Date.now()) {
      throw new BadRequestException('A meeting in the future cannot be marked Done.');
    }
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.partnershipMeeting.update({
        where: { id: meetingId },
        data: {
          ...(input.status ? { status: input.status as never } : {}),
          ...(input.outcome !== undefined ? { outcome: blank(input.outcome) } : {}),
        },
      });
      if (input.status === 'held' && lead.stage === 'conversation_booked') {
        await this.moveStage(tx, lead, 'evaluation_completed', { ...this.factsFor(lead, false), hasHeldMeeting: true }, { userId: null, reason: 'Meeting marked Done' });
      }
      if ((input.status === 'no_show' || input.status === 'cancelled') && lead.stage === 'conversation_booked') {
        await this.moveStage(tx, lead, 'conversation_attempted', this.factsFor(lead, false), { userId: null, reason: input.status === 'no_show' ? 'No-show' : 'Meeting cancelled' });
      }
      await this.audit(tx, { entityId: lead.id, action: 'update', actorId: userId, before: { meetingId, status: meeting.status }, after: { meetingId, status: saved.status } });
      return saved;
    });
  }

  async summary(userId: string, query: { ownerId?: string; category?: string }) {
    await this.assertView(userId);
    const leads = await this.prisma.partnershipLead.findMany({
      where: {
        archivedAt: null,
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
        ...(query.category ? { category: query.category as never } : {}),
      },
      include: { meetings: true },
    });
    const counts = buildPartnershipCounts(leads, new Date());
    const ownerForCap = query.ownerId || userId;
    const outreachUsed = await this.outreachCount(this.prisma, ownerForCap, lagosTodayIso(new Date()));
    return { ...counts, outreachUsed, outreachLimit: DAILY_FIRST_OUTREACH_CAP, outreachLeft: Math.max(0, DAILY_FIRST_OUTREACH_CAP - outreachUsed) };
  }

  async today(userId: string, query: { ownerId?: string; category?: string }) {
    const flags = await this.assertView(userId);
    const now = new Date();
    const today = lagosTodayIso(now);
    const leads = await this.prisma.partnershipLead.findMany({
      where: {
        archivedAt: null,
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
        ...(query.category ? { category: query.category as never } : {}),
      },
      include: { contacts: true, meetings: true, owner: { select: { id: true, fullName: true } } },
    });
    const rows = leads.map((lead) => ({ ...this.present(lead, today), canEdit: this.canChange(flags, lead.ownerId, userId) }));
    const weekend = lagosWeekday(now) === 0 || lagosWeekday(now) === 6;
    const meetingsToday = leads.flatMap((lead) => lead.meetings.filter((meeting) => lagosDateIso(meeting.startsAt) === today && meeting.status !== 'cancelled').map((meeting) => ({
      ...meeting,
      leadId: lead.id,
      companyName: lead.companyName,
      category: lead.category,
      primaryContact: lead.contacts.find((contact) => contact.isPrimary) || lead.contacts[0] || null,
      canEdit: this.canChange(flags, lead.ownerId, userId),
    })));
    return {
      dueToday: rows.filter((lead) => lead.followUpStatus === 'due_today'),
      overdue: rows.filter((lead) => lead.followUpStatus === 'overdue').sort((a, b) => (a.effectiveDueIso || '').localeCompare(b.effectiveDueIso || '')),
      meetingsToday,
      readyToContact: weekend ? [] : rows.filter((lead) => lead.stage === 'researching').sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    };
  }

  async owners(userId: string) {
    await this.assertView(userId);
    const users = await this.prisma.user.findMany({
      where: { role: 'admin', adminDashboardAccess: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    });
    const owners = [];
    for (const user of users) {
      if (await this.permissions.userHasPermission(user.id, 'partnerships.edit')) owners.push(user);
    }
    return owners;
  }

  async dedupe(userId: string, query: { email?: string; domain?: string; name?: string }) {
    await this.assertView(userId);
    const index = await this.duplicateIndex();
    return findDuplicate({ email: query.email, domain: query.domain, companyName: query.name }, index);
  }

  async linkPartner(userId: string, id: string, referrerId: string | null) {
    await this.assertManage(userId);
    const lead = await this.loadLead(id);
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.partnershipLead.update({ where: { id }, data: { referrerId } });
      await this.audit(tx, { entityId: id, action: 'link_partner', actorId: userId, before: { referrerId: lead.referrerId }, after: { referrerId } });
      return saved;
    });
  }

  async previewImport(userId: string, csv: string) {
    await this.assertManage(userId);
    const mapped = mapSheet(csv, lagosTodayIso(new Date()));
    if (mapped.error) throw new BadRequestException(mapped.error);
    const index = await this.duplicateIndex();
    const existingKeys = new Map((await this.prisma.partnershipLead.findMany({ where: { importKey: { not: null } }, select: { importKey: true, leadRef: true } })).map((lead) => [lead.importKey, lead.leadRef]));
    return mapped.rows.map((row) => this.previewRow(row, index, existingKeys));
  }

  async commitImport(userId: string, csv: string, input: { ownerId: string; rows?: { importKey: string; category?: string; importAnyway?: boolean }[] }) {
    await this.assertManage(userId);
    const canOwn = await this.permissions.userHasPermission(input.ownerId, 'partnerships.edit');
    if (!canOwn) throw new BadRequestException('Pick an owner who can edit partner leads.');
    const mapped = mapSheet(csv, lagosTodayIso(new Date()));
    if (mapped.error) throw new BadRequestException(mapped.error);
    const choices = new Map((input.rows || []).map((row) => [row.importKey, row]));
    const created: { leadRef: string; companyName: string }[] = [];
    const skipped: { companyName: string; reason: string }[] = [];
    const failed: { companyName: string; reason: string }[] = [];
    for (const row of mapped.rows) {
      const choice = choices.get(row.importKey);
      try {
        const result = await this.importOne(userId, input.ownerId, row, choice);
        if (result.created) created.push(result.created);
        if (result.skipped) skipped.push(result.skipped);
      } catch (error) {
        failed.push({ companyName: row.companyName, reason: error instanceof Error ? error.message : 'This row could not be imported.' });
      }
    }
    return { created, skipped, failed };
  }

  private async importOne(userId: string, ownerId: string, row: MappedSheetRow, choice?: { category?: string; importAnyway?: boolean }) {
    const existing = await this.prisma.partnershipLead.findUnique({ where: { importKey: row.importKey } });
    if (existing) return { skipped: { companyName: row.companyName, reason: `Already imported as ${existing.leadRef}` } };
    const index = await this.duplicateIndex();
    const hit = findDuplicate({ email: row.contact?.email, domain: row.websiteDomain, companyName: row.companyName }, index);
    if (hit?.kind === 'email' || hit?.kind === 'domain') {
      return { skipped: { companyName: row.companyName, reason: `Matches ${hit.leadRef}, not imported` } };
    }
    if (hit?.kind === 'name' && !choice?.importAnyway) {
      return { skipped: { companyName: row.companyName, reason: `Name matches ${hit.leadRef}. Tick Import anyway to add it.` } };
    }
    const category = choice?.category || row.category;
    const created = await this.prisma.$transaction(async (tx) => {
      const leadRef = await this.nextLeadRef(tx);
      const lead = await tx.partnershipLead.create({
        data: {
          leadRef,
          companyName: row.companyName,
          companyNameNormalised: row.companyNameNormalised,
          category: category as never,
          website: row.website,
          websiteDomain: row.websiteDomain,
          city: row.city,
          state: row.state,
          whyTheyMatter: row.whyTheyMatter,
          whatWeKnow: row.whatWeKnow,
          suspectedProblem: row.suspectedProblem,
          exactNextAction: row.exactNextAction,
          stage: row.stage as never,
          followUpStep: row.followUpStep as never,
          temperature: (row.temperature as never) || null,
          nextFollowUpOverride: row.nextFollowUpOverride ? new Date(`${row.nextFollowUpOverride}T00:00:00.000Z`) : null,
          importKey: row.importKey,
          sourceType: 'sheet_import',
          sourceDetail: 'PDE sheet export 8 Oct 2026',
          ownerId,
          createdById: userId,
        },
      });
      if (row.contact) {
        await tx.partnershipContact.create({
          data: {
            leadId: lead.id,
            fullName: row.contact.fullName,
            position: row.contact.position,
            email: row.contact.email,
            emailNormalised: row.contact.email,
            phone: row.contact.phone,
            whatsapp: row.contact.whatsapp,
            linkedinUrl: row.contact.linkedinUrl,
            isDecisionMaker: row.contact.isDecisionMaker,
            isPrimary: true,
          },
        });
      }
      await tx.partnershipStageChange.create({
        data: { leadId: lead.id, fromStage: null, toStage: row.stage as never, toStep: row.followUpStep as never, reason: 'Imported from sheet', changedById: userId },
      });
      if (row.touch) {
        const occurredAt = new Date(`${row.touch.dateIso}T12:00:00+01:00`);
        await tx.partnershipTouch.create({
          data: {
            leadId: lead.id,
            occurredAt,
            channel: row.touch.channel as never,
            direction: 'outbound',
            kind: 'other',
            outcome: row.touch.outcome as never,
            summary: row.touch.summary,
            stepAtTouch: row.followUpStep as never,
            dueDateAtTouch: null,
            loggedById: userId,
            isImported: true,
          },
        });
        await tx.partnershipLead.update({
          where: { id: lead.id },
          data: { lastContactAt: occurredAt, lastContactChannel: row.touch.channel as never, lastOutcome: row.touch.outcome as never },
        });
      }
      if (row.meeting) {
        await tx.partnershipMeeting.create({
          data: {
            leadId: lead.id,
            startsAt: new Date(`${row.meeting.dateIso}T12:00:00+01:00`),
            status: row.meeting.status,
            outcome: row.meeting.outcome,
            bookedById: userId,
          },
        });
      }
      if (row.noteLines.length) {
        await tx.partnershipTouch.create({
          data: {
            leadId: lead.id,
            occurredAt: new Date(`${lagosTodayIso(new Date())}T12:00:00+01:00`),
            channel: 'other',
            direction: 'internal_note',
            kind: 'note',
            summary: ['Imported from sheet (8 Oct 2026)', ...row.noteLines.map((line) => `${line.label}: ${line.value}`)].join('\n'),
            stepAtTouch: row.followUpStep as never,
            loggedById: userId,
            isImported: true,
          },
        });
      }
      await this.audit(tx, { entityId: lead.id, action: 'import', actorId: userId, before: null, after: { leadRef, importKey: row.importKey } });
      return { leadRef, companyName: row.companyName };
    });
    return { created };
  }

  private previewRow(row: MappedSheetRow, index: { id: string; leadRef: string; companyNameNormalised: string; websiteDomain: string | null; emails: string[] }[], keys: Map<string | null, string>) {
    const already = keys.get(row.importKey);
    if (already) return { ...row, action: 'already_imported', message: `Already imported as ${already}` };
    const hit = findDuplicate({ email: row.contact?.email, domain: row.websiteDomain, companyName: row.companyName }, index);
    if (hit?.kind === 'email' || hit?.kind === 'domain') return { ...row, action: 'duplicate', message: `Matches ${hit.leadRef}, not imported` };
    if (hit?.kind === 'name') return { ...row, action: 'name_warning', message: `Name matches ${hit.leadRef}.` };
    return { ...row, action: 'create', message: 'Will be created' };
  }

  private async writeTouch(tx: Tx, lead: Awaited<ReturnType<PartnershipsService['loadLead']>>, userId: string, input: Record<string, any>, occurredAt: Date, historical: boolean) {
    const today = lagosTodayIso(occurredAt);
    const due = effectiveDueIso(dateOnlyIso(lead.nextFollowUpOverride), playbookDueIso(lead.lastContactAt, lead.followUpStep));
    const fromMailbox = input.channel === 'email' ? (blank(input.fromMailbox) || INSPECT_MAILBOX) : blank(input.fromMailbox);
    const touch = await tx.partnershipTouch.create({
      data: {
        leadId: lead.id,
        contactId: input.contactId || null,
        occurredAt,
        channel: input.channel,
        direction: input.direction,
        kind: input.kind,
        outcome: input.outcome || null,
        summary: blank(input.summary),
        stepAtTouch: lead.followUpStep,
        dueDateAtTouch: due ? new Date(`${due}T12:00:00+01:00`) : null,
        fromMailbox,
        toAddress: blank(input.toAddress),
        emailSubject: blank(input.emailSubject),
        loggedById: userId,
        isImported: false,
      },
    });
    const patch: Prisma.PartnershipLeadUpdateInput = {};
    if ((input.direction === 'outbound' || input.direction === 'inbound') && (!lead.lastContactAt || occurredAt > lead.lastContactAt)) {
      patch.lastContactAt = occurredAt;
      patch.lastContactChannel = input.channel;
      patch.lastOutcome = input.outcome || null;
    }
    if (input.direction === 'inbound') patch.lastInboundAt = occurredAt;
    if (input.kind === 'first_outreach' && !lead.firstOutreachAt) patch.firstOutreachAt = occurredAt;
    if (input.nextFollowUpOverride) patch.nextFollowUpOverride = new Date(`${String(input.nextFollowUpOverride).slice(0, 10)}T00:00:00.000Z`);
    if (!historical && input.direction === 'outbound' && PLAYBOOK_KINDS.has(input.kind)) {
      patch.followUpStep = (input.nextStep || nextStep(lead.followUpStep)) as never;
    }
    let current: any = { ...lead, stage: lead.stage, followUpStep: (patch.followUpStep as string) || lead.followUpStep };
    if (Object.keys(patch).length) {
      const saved = await tx.partnershipLead.update({ where: { id: lead.id }, data: patch });
      current = { ...current, ...saved, contacts: lead.contacts, meetings: lead.meetings, owner: lead.owner, touches: lead.touches, stageChanges: lead.stageChanges };
    }
    if (!historical && input.direction === 'outbound' && current.stage === 'researching') {
      current = await this.moveStage(tx, current, 'initial_outreach', { viaFirstOutreach: true }, { userId: null, reason: 'First outreach logged' });
    }
    if (!historical && input.toStage) {
      current = await this.moveStage(tx, current, input.toStage, this.factsFor(current, false, input.reason), { userId, reason: input.reason });
    }
    if (!historical && input.outcome === 'opted_out') {
      current = await this.moveStage(tx, current, 'closed_not_interested', {}, { userId: null, reason: 'Contact opted out', force: true });
      if (input.contactId) await tx.partnershipContact.update({ where: { id: input.contactId }, data: { doNotContact: true, doNotContactReason: 'Opted out' } });
    }
    if (!historical && input.kind === 'close_the_loop') {
      await tx.partnershipLead.update({ where: { id: lead.id }, data: { followUpStep: 'day_60' } });
      current = await this.moveStage(tx, current, 'dormant', {}, { userId: null, reason: 'Close the loop', force: true });
    }
    await this.audit(tx, { entityId: lead.id, action: 'update', actorId: userId, before: this.snapshot(lead), after: { touchId: touch.id, stage: current.stage, override: input.override || false, reason: input.reason || null } });
    return { touch, lead: current };
  }

  private async moveStage(tx: Tx, lead: { id: string; stage: string; followUpStep: string; contacts?: any; meetings?: any; owner?: any; touches?: any; stageChanges?: any }, toStage: string, facts: { viaFirstOutreach?: boolean; hasMeeting?: boolean; hasHeldMeeting?: boolean; hasLinkedPartner?: boolean; hasManage?: boolean; reason?: string }, options: { userId: string | null; reason?: string | null; force?: boolean }) {
    if (!options.force) {
      const check = canMoveStage(lead.stage, toStage, { ...facts, reason: options.reason || facts.reason || '' });
      if (!check.ok) throw new BadRequestException(check.message);
    }
    const fromStage = lead.stage;
    const saved = await tx.partnershipLead.update({ where: { id: lead.id }, data: { stage: toStage as never } });
    await tx.partnershipStageChange.create({
      data: {
        leadId: lead.id,
        fromStage: fromStage as never,
        toStage: toStage as never,
        fromStep: lead.followUpStep as never,
        toStep: lead.followUpStep as never,
        reason: options.reason || null,
        changedById: options.userId,
      },
    });
    return { ...lead, ...saved, stage: toStage };
  }

  private factsFor(lead: { stage: string; meetings: { status: string }[]; referrerId: string | null }, manage: boolean, reason?: string) {
    return {
      hasMeeting: lead.meetings.length > 0,
      hasHeldMeeting: lead.meetings.some((meeting) => meeting.status === 'held'),
      hasLinkedPartner: Boolean(lead.referrerId),
      hasManage: manage,
      reason: reason || '',
    };
  }

  private async outreachCount(db: Tx | PrismaService, ownerId: string, dayIso: string) {
    const leads = await db.partnershipLead.findMany({ where: { ownerId }, select: { id: true } });
    if (!leads.length) return 0;
    const touches = await db.partnershipTouch.findMany({
      where: { kind: 'first_outreach', leadId: { in: leads.map((lead) => lead.id) } },
      select: { occurredAt: true },
    });
    return touches.filter((touch) => lagosDateIso(touch.occurredAt) === dayIso).length;
  }

  private async partnerPanel(lead: { id: string; referrerId: string | null; contacts: { emailNormalised: string | null }[]; touches: { kind: string }[] }) {
    const resolved = await this.resolvePartner(lead);
    const invited = lead.touches.some((touch) => touch.kind === 'partner_invite');
    const referrer = resolved.referrer;
    const status = partnerStatus(referrer?.applicationStatus, invited, Boolean(referrer));
    if (!referrer) {
      return { linked: false, matchNeeded: resolved.matchNeeded, candidates: resolved.candidates, status, referrerId: null };
    }
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [agreement, clicks30, attributions, commissions] = await Promise.all([
      this.prisma.partnerAgreement.findFirst({ where: { referrerId: referrer.id, status: 'active' }, orderBy: { effectiveFrom: 'desc' } }),
      this.prisma.referralClick.count({ where: { referrerId: referrer.id, clickedAt: { gte: since } } }),
      this.prisma.customerAttribution.findMany({ where: { referrerId: referrer.id }, select: { userId: true } }),
      this.prisma.partnerCommission.findMany({ where: { referrerId: referrer.id } }),
    ]);
    const homeownerIds = attributions.map((row) => row.userId);
    const projectRows = await this.prisma.project.findMany({
      where: { OR: [{ referrerId: referrer.id }, ...(homeownerIds.length ? [{ homeownerId: { in: homeownerIds } }] : [])] },
      select: { id: true, status: true },
    });
    const uniqueProjects = [...new Map(projectRows.map((project) => [project.id, project])).values()];
    const byStatus = new Map<string, { status: string; count: number; amount: number }>();
    for (const commission of commissions) {
      const current = byStatus.get(commission.status) || { status: commission.status, count: 0, amount: 0 };
      current.count += 1;
      current.amount += commission.amount;
      byStatus.set(commission.status, current);
    }
    const projectCounts = new Map<string, number>();
    uniqueProjects.forEach((project) => projectCounts.set(project.status, (projectCounts.get(project.status) || 0) + 1));
    return {
      linked: true,
      matchNeeded: false,
      candidates: [],
      status,
      referrerId: referrer.id,
      code: referrer.code,
      approvedAt: referrer.approvedAt,
      rateLabel: agreement ? formatRateBps(agreement.rateBps) : null,
      clicks30,
      referredHomeowners: attributions.length,
      referredProjects: [...projectCounts.entries()].map(([statusName, count]) => ({ status: statusName, count })),
      commissionJobs: commissions.filter((commission) => commission.status !== 'reversed').length,
      commissionsByStatus: [...byStatus.values()],
    };
  }

  private async resolvePartner(lead: { referrerId: string | null; contacts: { emailNormalised: string | null }[] }) {
    if (lead.referrerId) {
      const referrer = await this.prisma.referrer.findFirst({ where: { id: lead.referrerId, archivedAt: null } });
      return { referrer, matchNeeded: false, candidates: [] as { id: string; name: string; email: string | null }[] };
    }
    const emails = lead.contacts.map((contact) => contact.emailNormalised).filter((email): email is string => Boolean(email));
    if (!emails.length) return { referrer: null, matchNeeded: false, candidates: [] };
    const referrers = await this.prisma.referrer.findMany({ where: { archivedAt: null, email: { not: null } }, select: { id: true, name: true, email: true, code: true, applicationStatus: true, approvedAt: true } });
    const matches = referrers.filter((referrer) => emails.includes((referrer.email || '').trim().toLowerCase()));
    if (matches.length === 1) return { referrer: matches[0], matchNeeded: false, candidates: matches };
    if (matches.length > 1) return { referrer: null, matchNeeded: true, candidates: matches.map((referrer) => ({ id: referrer.id, name: referrer.name, email: referrer.email })) };
    return { referrer: null, matchNeeded: false, candidates: [] };
  }

  private present(lead: any, today: string) {
    const due = effectiveDueIso(dateOnlyIso(lead.nextFollowUpOverride), playbookDueIso(lead.lastContactAt, lead.followUpStep));
    return {
      ...lead,
      followUpStatus: followUpStatus(lead.stage, due, today),
      effectiveDueIso: due,
      daysSinceLastContact: daysSinceLastContact(lead.lastContactAt, today),
      nextStepText: nextStepText(lead.stage, lead.followUpStep),
      suggestedStep: nextStep(lead.followUpStep),
      nurtureCheckDue: nurtureCheckDue(lead.stage, due, today),
    };
  }

  private statusMatches(status: string, stage: string, filter: string) {
    if (filter === 'action') return status === 'overdue' || status === 'due_today';
    if (filter === 'closed') return stage.startsWith('closed_');
    if (filter === 'dormant_or_closed') return stage === 'dormant' || stage.startsWith('closed_');
    if (filter === 'partner') return stage === 'active_partner';
    return status === filter || stage === filter;
  }

  private async loadLead(id: string) {
    const lead = await this.prisma.partnershipLead.findUnique({ where: { id }, include: leadInclude });
    if (!lead || !lead.owner) throw new NotFoundException('This lead was not found.');
    return lead;
  }

  private async duplicateIndex() {
    const leads = await this.prisma.partnershipLead.findMany({ include: { contacts: true } });
    return leads.map((lead) => ({
      id: lead.id,
      leadRef: lead.leadRef,
      companyNameNormalised: lead.companyNameNormalised,
      websiteDomain: lead.websiteDomain,
      emails: lead.contacts.map((contact) => contact.emailNormalised).filter((email): email is string => Boolean(email)),
    }));
  }

  private async refuseDuplicate(input: { email?: string | null; domain?: string | null; companyName?: string | null; ignoreLeadId?: string | null; createAnyway?: boolean; reason?: string | null; userId: string }) {
    const hit = findDuplicate(input, await this.duplicateIndex());
    if (!hit) return;
    if (hit.kind === 'name') {
      if (input.createAnyway && String(input.reason || '').trim()) return;
      throw new BadRequestException({ message: `A lead with a similar name already exists (${hit.leadRef}). Create it anyway only if this is a different company.`, warning: true, leadId: hit.leadId, leadRef: hit.leadRef });
    }
    throw new ConflictException({ message: `This matches ${hit.leadRef}. Open that lead instead of creating another.`, leadId: hit.leadId, leadRef: hit.leadRef });
  }

  private async nextLeadRef(tx: Tx) {
    const leads = await tx.partnershipLead.findMany({ select: { leadRef: true } });
    const max = leads.reduce((best, lead) => Math.max(best, Number(String(lead.leadRef).replace(/\D/g, '')) || 0), 0);
    return `PL-${String(max + 1).padStart(4, '0')}`;
  }

  private async audit(tx: Tx, input: { entityId: string; action: string; actorId: string; before: unknown; after: unknown }) {
    await tx.partnershipAuditLog.create({
      data: {
        entity: 'lead',
        entityId: input.entityId,
        action: input.action,
        before: input.before == null ? Prisma.JsonNull : (input.before as Prisma.InputJsonValue),
        after: input.after == null ? Prisma.JsonNull : (input.after as Prisma.InputJsonValue),
        actorId: input.actorId,
      },
    });
  }

  private snapshot(lead: { companyName?: string; stage: string; followUpStep: string; ownerId?: string; category?: string; groupName?: string | null; archivedAt?: Date | null; referrerId?: string | null; lastContactAt?: Date | null }) {
    return {
      companyName: lead.companyName,
      stage: lead.stage,
      followUpStep: lead.followUpStep,
      ownerId: lead.ownerId,
      category: lead.category,
      groupName: lead.groupName,
      archivedAt: lead.archivedAt ? lead.archivedAt.toISOString() : null,
      referrerId: lead.referrerId,
      lastContactAt: lead.lastContactAt ? lead.lastContactAt.toISOString() : null,
    };
  }

  private async flags(userId: string): Promise<Flags> {
    const [view, edit, manage] = await Promise.all([
      this.permissions.userHasPermission(userId, 'partnerships.view'),
      this.permissions.userHasPermission(userId, 'partnerships.edit'),
      this.permissions.userHasPermission(userId, 'partnerships.manage'),
    ]);
    return { view, edit, manage };
  }

  private async assertView(userId: string) {
    const flags = await this.flags(userId);
    if (!flags.view) throw new ForbiddenException('You cannot view partner leads.');
    return flags;
  }

  private async assertEdit(userId: string) {
    const flags = await this.assertView(userId);
    if (!flags.edit && !flags.manage) throw new ForbiddenException('You cannot change partner leads.');
    return flags;
  }

  private async assertManage(userId: string) {
    const flags = await this.assertView(userId);
    if (!flags.manage) throw new ForbiddenException('Only a Partnerships Admin can do this.');
    return flags;
  }

  private async assertCanChangeLead(userId: string, lead: { ownerId: string }) {
    const flags = await this.assertView(userId);
    if (flags.manage) return flags;
    if (flags.edit && lead.ownerId === userId) return flags;
    if (flags.edit) throw new ForbiddenException('You can only change leads you own.');
    throw new ForbiddenException('You cannot change partner leads.');
  }

  private canChange(flags: Flags, ownerId: string, userId: string) {
    return flags.manage || (flags.edit && ownerId === userId);
  }
}

const leadInclude = {
  contacts: true,
  touches: true,
  meetings: true,
  stageChanges: true,
  owner: { select: { id: true, fullName: true } },
} satisfies Prisma.PartnershipLeadInclude;

function blank(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
}

function partnerStatus(applicationStatus: string | null | undefined, invited: boolean, linked: boolean) {
  if (linked && applicationStatus === 'approved') return 'Partner approved';
  if (linked && applicationStatus === 'suspended') return 'Suspended';
  if (linked && applicationStatus === 'applied') return 'Applied';
  if (invited) return 'Invited';
  return 'Not invited';
}

export function formatRateBps(rateBps: number): string {
  const whole = Math.trunc(rateBps / 100);
  const fraction = Math.abs(rateBps % 100);
  if (!fraction) return `${whole}%`;
  const digits = String(fraction).padStart(2, '0').replace(/0$/, '');
  return `${whole}.${digits}%`;
}

export { buildPartnershipCounts };

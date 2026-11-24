import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PartnershipsService } from './partnerships.service';

const perms: Record<string, string[]> = {
  pde: ['partnerships.view', 'partnerships.edit'],
  admin: ['partnerships.view', 'partnerships.edit', 'partnerships.manage'],
  auditor: ['partnerships.view'],
  none: [],
  other: ['partnerships.view', 'partnerships.edit'],
};

function match(row: any, where: any): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return (value as any[]).some((item) => match(row, item));
    if (key === 'AND') return (value as any[]).every((item) => match(row, item));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      const filter = value as any;
      if ('in' in filter) return filter.in.includes(row[key]);
      if ('not' in filter) return row[key] !== filter.not;
      if ('gte' in filter) return row[key] >= filter.gte;
      return false;
    }
    return row[key] === value;
  });
}

class Memory {
  leads: any[] = [];
  contacts: any[] = [];
  touches: any[] = [];
  meetings: any[] = [];
  stageChanges: any[] = [];
  audits: any[] = [];
  users: any[] = [];
  referrers: any[] = [];
  agreements: any[] = [];
  clicks: any[] = [];
  attributions: any[] = [];
  commissions: any[] = [];
  projects: any[] = [];
  failAudit = false;

  private snap() {
    return structuredClone({
      leads: this.leads,
      contacts: this.contacts,
      touches: this.touches,
      meetings: this.meetings,
      stageChanges: this.stageChanges,
      audits: this.audits,
    });
  }

  private restore(data: any) {
    this.leads = data.leads;
    this.contacts = data.contacts;
    this.touches = data.touches;
    this.meetings = data.meetings;
    this.stageChanges = data.stageChanges;
    this.audits = data.audits;
  }

  private decorate(lead: any, include?: any) {
    if (!include) return { ...lead };
    return {
      ...lead,
      ...(include.contacts ? { contacts: this.contacts.filter((contact) => contact.leadId === lead.id) } : {}),
      ...(include.touches ? { touches: this.touches.filter((touch) => touch.leadId === lead.id) } : {}),
      ...(include.meetings ? { meetings: this.meetings.filter((meeting) => meeting.leadId === lead.id) } : {}),
      ...(include.stageChanges ? { stageChanges: this.stageChanges.filter((change) => change.leadId === lead.id) } : {}),
      ...(include.owner ? { owner: this.users.find((user) => user.id === lead.ownerId) || null } : {}),
    };
  }

  private table(name: 'leads' | 'contacts' | 'touches' | 'meetings' | 'stageChanges' | 'audits' | 'users' | 'referrers' | 'agreements' | 'clicks' | 'attributions' | 'commissions' | 'projects') {
    const rows = () => this[name] as any[];
    return {
      findMany: async (args: any = {}) => {
        let found = rows().filter((row) => match(row, args.where));
        if (args.orderBy?.createdAt === 'asc') found = [...found].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (args.orderBy?.at === 'desc') found = [...found].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        if (args.orderBy?.fullName === 'asc') found = [...found].sort((a, b) => String(a.fullName).localeCompare(String(b.fullName)));
        if (name === 'leads') found = found.map((row) => this.decorate(row, args.include));
        if (args.select) found = found.map((row) => Object.fromEntries(Object.keys(args.select).map((key) => [key, row[key]])));
        return found;
      },
      findUnique: async (args: any) => {
        const found = rows().find((row) => match(row, args.where));
        if (!found) return null;
        return name === 'leads' ? this.decorate(found, args.include) : { ...found };
      },
      findFirst: async (args: any) => {
        const found = rows().find((row) => match(row, args.where));
        return found ? { ...found } : null;
      },
      findUniqueOrThrow: async (args: any) => {
        const found = rows().find((row) => match(row, args.where));
        if (!found) throw new Error('missing');
        return name === 'leads' ? this.decorate(found, args.include) : { ...found };
      },
      create: async (args: any) => {
        if (name === 'audits' && this.failAudit) throw new Error('audit failed');
        const data = { ...args.data };
        if (data.owner?.connect?.id) {
          data.ownerId = data.owner.connect.id;
          delete data.owner;
        }
        const row = { id: data.id || `${name}-${rows().length + 1}`, createdAt: new Date(), updatedAt: new Date(), at: new Date(), changedAt: new Date(), ...data };
        rows().push(row);
        return { ...row };
      },
      update: async (args: any) => {
        const row = rows().find((item) => match(item, args.where));
        if (!row) throw new Error('missing');
        const data = { ...args.data };
        if (data.owner?.connect?.id) {
          data.ownerId = data.owner.connect.id;
          delete data.owner;
        }
        Object.assign(row, data, { updatedAt: new Date() });
        return { ...row };
      },
      updateMany: async (args: any) => {
        rows().filter((row) => match(row, args.where)).forEach((row) => Object.assign(row, args.data));
        return { count: 1 };
      },
      count: async (args: any = {}) => rows().filter((row) => match(row, args.where)).length,
    };
  }

  partnershipLead = this.table('leads');
  partnershipContact = this.table('contacts');
  partnershipTouch = this.table('touches');
  partnershipMeeting = this.table('meetings');
  partnershipStageChange = this.table('stageChanges');
  partnershipAuditLog = this.table('audits');
  user = this.table('users');
  referrer = this.table('referrers');
  partnerAgreement = this.table('agreements');
  referralClick = this.table('clicks');
  customerAttribution = this.table('attributions');
  partnerCommission = this.table('commissions');
  project = this.table('projects');

  async $transaction(fn: (tx: Memory) => Promise<any>) {
    const snap = this.snap();
    try {
      return await fn(this);
    } catch (error) {
      this.restore(snap);
      throw error;
    }
  }
}

function lead(id: string, ownerId: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    leadRef: id === 'a' ? 'PL-0001' : 'PL-0002',
    companyName: id === 'a' ? 'Test QS Ltd' : 'Test Law Ltd',
    companyNameNormalised: id === 'a' ? 'test qs' : 'test law',
    category: 'quantity_surveyor',
    stage: 'initial_outreach',
    followUpStep: 'day_0',
    ownerId,
    createdById: ownerId,
    sourceType: 'admin',
    websiteDomain: null,
    groupName: null,
    referrerId: null,
    archivedAt: null,
    lastContactAt: null,
    temperature: null,
    nextFollowUpOverride: null,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    ...extra,
  };
}

describe('partnership access', () => {
  let db: Memory;
  let service: PartnershipsService;

  beforeEach(() => {
    db = new Memory();
    db.users.push(
      { id: 'pde', fullName: 'Valentine Test', email: 'valentine@example.test', role: 'admin', adminDashboardAccess: true },
      { id: 'other', fullName: 'Other Owner', email: 'other@example.test', role: 'admin', adminDashboardAccess: true },
      { id: 'admin', fullName: 'Admin Test', email: 'admin@example.test', role: 'admin', adminDashboardAccess: true },
      { id: 'auditor', fullName: 'Auditor Test', email: 'auditor@example.test', role: 'admin', adminDashboardAccess: true },
    );
    db.leads.push(lead('a', 'pde'), lead('b', 'other'));
    service = new PartnershipsService(db as any, { userHasPermission: async (userId: string, key: string) => perms[userId]?.includes(key) } as any);
  });

  it('lets a PDE read both leads and change only her own', async () => {
    expect((await service.get('pde', 'a')).companyName).toBe('Test QS Ltd');
    expect((await service.get('pde', 'b')).companyName).toBe('Test Law Ltd');
    await service.update('pde', 'a', { exactNextAction: 'Send the one pager.' });
    await service.addContact('pde', 'a', { fullName: 'Ada Test', email: 'ada@example.test' });
    await service.logTouch('pde', 'a', { channel: 'email', direction: 'outbound', kind: 'utility', occurredAt: new Date().toISOString(), summary: 'Sent one page.' });
    await service.changeStage('pde', 'a', { toStage: 'gatekeeper' });
    await service.addMeeting('pde', 'a', { startsAt: new Date(Date.now() + 86400000).toISOString() });
    await expect(service.update('pde', 'b', { city: 'Lagos' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.addContact('pde', 'b', { fullName: 'No Test' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.logTouch('pde', 'b', { channel: 'email', direction: 'outbound', kind: 'note', occurredAt: new Date().toISOString() })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.addMeeting('pde', 'b', { startsAt: new Date().toISOString() })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.changeStage('pde', 'b', { toStage: 'dormant', reason: 'No reply after several notes.' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.update('pde', 'b', { ownerId: 'pde' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.archive('pde', 'b')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.linkPartner('pde', 'b', null)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.previewImport('pde', 'Company Name\n')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps a lead created by the PDE in her name', async () => {
    const created = await service.create('pde', { companyName: 'Test Diaspora Lead', category: 'diaspora_group', groupName: 'Sample Circle', sourceType: 'admin', ownerId: 'admin', contact: { fullName: 'Kemi Test', email: 'kemi@example.test' } });
    expect(created.ownerId).toBe('pde');
    expect(created.groupName).toBe('Sample Circle');
    const second = await service.create('pde', { companyName: 'Test Diaspora Two', category: 'diaspora_group', groupName: 'Sample Circle', sourceType: 'admin', contact: { fullName: 'Tunde Test', email: 'tunde@example.test' } });
    expect(second.id).not.toBe(created.id);
    expect(second.groupName).toBe('Sample Circle');
  });

  it('lets a Partnerships Admin change every lead', async () => {
    await service.update('admin', 'b', { city: 'Abuja' });
    await service.archive('admin', 'b');
    expect(db.leads.find((item) => item.id === 'b').archivedAt).toBeTruthy();
  });

  it('lets an auditor read and blocks every write', async () => {
    expect((await service.list('auditor', {})).length).toBe(2);
    await expect(service.update('auditor', 'a', { city: 'Lagos' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.create('auditor', { companyName: 'Nope Ltd', category: 'other', sourceType: 'admin' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.logTouch('auditor', 'a', { channel: 'email', direction: 'outbound', kind: 'note', occurredAt: new Date().toISOString() })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks a user with no partnerships permission from the list', async () => {
    await expect(service.list('none', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rolls a follow-up back when a later write fails', async () => {
    db.leads.find((item) => item.id === 'a').stage = 'researching';
    db.failAudit = true;
    await expect(service.logTouch('pde', 'a', { channel: 'email', direction: 'outbound', kind: 'first_outreach', occurredAt: new Date().toISOString(), summary: 'Hello.' })).rejects.toThrow('audit failed');
    expect(db.touches).toHaveLength(0);
    expect(db.leads.find((item) => item.id === 'a').stage).toBe('researching');
  });

  it('stops a third first outreach unless a Partnerships Admin overrides it', async () => {
    const touch = { channel: 'email', direction: 'outbound', kind: 'first_outreach', occurredAt: new Date().toISOString(), summary: 'Hello.' };
    await service.logTouch('pde', 'a', touch);
    const second = await service.logTouch('pde', 'a', touch);
    expect(second.warning).toContain('A 3rd needs a Partnerships Admin.');
    await expect(service.logTouch('pde', 'a', touch)).rejects.toBeInstanceOf(BadRequestException);
    await service.logTouch('admin', 'a', { ...touch, override: true, reason: 'The firm replied and asked for the page today.' });
    expect(db.touches.filter((item) => item.kind === 'first_outreach')).toHaveLength(3);
  });

  it('blocks an email or website match and warns on the company name', async () => {
    db.contacts.push({ id: 'c1', leadId: 'a', fullName: 'Ada Test', emailNormalised: 'ada@example.test', isPrimary: true });
    db.leads.find((item) => item.id === 'a').websiteDomain = 'testqs.example';
    await expect(service.create('pde', { companyName: 'Different Name', category: 'architect', sourceType: 'admin', contact: { fullName: 'Ada Test', email: 'ada@example.test' } })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.create('pde', { companyName: 'Different Name', category: 'architect', sourceType: 'admin', website: 'https://www.testqs.example/about', contact: { fullName: 'New Person' } })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.create('admin', { companyName: 'Test QS Limited', category: 'architect', sourceType: 'admin', contact: { fullName: 'New Person', email: 'new@example.test' } })).rejects.toBeInstanceOf(BadRequestException);
    const created = await service.create('admin', { companyName: 'Test QS Limited', category: 'architect', sourceType: 'admin', createAnyway: true, reason: 'This is a different office.', contact: { fullName: 'New Person', email: 'new@example.test' } });
    expect(created.companyName).toBe('Test QS Limited');
  });
});

import { mapSheet } from './sheet-import';
import { PartnershipsService } from './partnerships.service';

const HEADERS = [
  'Lead ID', 'Company Name', 'Company Type', 'Website', 'City / State', 'Contact Name', 'Contact Position', 'Phone / WhatsApp', 'Email',
  'Decision-Maker Confirmed?', 'LinkedIn / Social Profile', 'Current Relationship Stage', 'Last Contact Date', 'Last Contact Channel',
  'Last Contact Outcome', 'Objection / Reaction', 'Next Follow-Up Date', 'Follow-Up Stage', 'Relationship Temperature', 'Exact Next Action',
  'Why This Company Matters', 'What We Know About Them', 'Suspected Relevant Problem', 'Meeting Date', 'Meeting Outcome',
  'Authority Proof Already Sent?', 'Utility / Tool Already Sent?', 'Last Value Sent', 'Reason for Next Contact', 'Problem They Actually Admitted',
  'BuildMyHouse Opportunity Identified', 'Pilot Opportunity?', 'Partnership Potential', 'Source of Lead', 'Notes', 'Owner',
  'Days Since Last Contact', 'Follow-Up Status', 'Playbook Due Date', 'Effective Follow-Up Date', 'Next Playbook Message',
];

function row(values: Record<string, string>) {
  return HEADERS.map((header) => {
    const value = values[header] || '';
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(',');
}

const csv = [
  HEADERS.join(','),
  row({
    'Company Name': '\nTest QS Ltd\n',
    'Company Type': 'Quantity Surveyor',
    'Website': 'testqs.example',
    'Phone / WhatsApp': "'+234 806 000 0000 / +234 805 000 0000",
    Email: 'ada-qs@example.test',
    'Contact Name': 'Ada Test',
    'Decision-Maker Confirmed?': 'YES - Ada Test (https://linkedin.example/ada)',
    'Current Relationship Stage': 'Outreach sent',
    'Last Contact Date': '46285',
    'Last Contact Channel': 'WhatsApp/ Telephone',
    'Last Contact Outcome': 'No answer',
    'Follow-Up Stage': 'Day 4 - Authority Proof',
    'Days Since Last Contact': '99',
    'Follow-Up Status': 'Overdue',
    'Playbook Due Date': '01/01/2020',
    'Effective Follow-Up Date': '01/01/2020',
    'Next Playbook Message': 'Do not copy this formula',
    Notes: 'Kept in the note',
  }),
  row({
    'Company Name': 'Test Law Ltd',
    'Company Type': 'Project Manager',
    'Phone / WhatsApp': '=2348100000000',
    'Current Relationship Stage': 'Closed - Not Interested',
    'Contact Name': 'Chidi Test',
    Email: 'ada@example.test',
  }),
].join('\n');

describe('sheet import mapping', () => {
  it('maps the fixture and ignores the formula columns', () => {
    const mapped = mapSheet(csv, '2026-11-30');
    expect(mapped.error).toBeUndefined();
    expect(mapped.rows).toHaveLength(2);
    const first = mapped.rows[0];
    expect(first.companyName).toBe('Test QS Ltd');
    expect(first.stage).toBe('initial_outreach');
    expect(first.warnings.join(' ')).toContain('Outreach sent');
    expect(first.contact?.phone).toBe('+2348060000000');
    expect(first.contact?.whatsapp).toBe('+2348050000000');
    expect(first.contact?.isDecisionMaker).toBe(true);
    expect(first.touch?.dateIso).toBe('2026-09-20');
    expect(first.touch?.channel).toBe('whatsapp');
    expect(first.touch?.summary).toContain('also by phone');
    expect(first.followUpStep).toBe('day_4');
    expect(first.noteLines.some((line) => line.label === 'Days Since Last Contact')).toBe(false);
    expect(first.noteLines.some((line) => line.value.includes('Do not copy'))).toBe(false);
    expect(first.noteLines.some((line) => line.label === 'Notes')).toBe(true);
    expect(mapped.rows[1].category).toBe('other');
    expect(mapped.rows[1].stage).toBe('closed_not_interested');
    expect(mapped.rows[1].contact?.phone).toBe('+2348100000000');
    expect(mapped.rows[1].warnings.join(' ')).toContain('Project Manager');
  });
});

describe('sheet import commit', () => {
  it('skips an email match and creates nothing on a second commit', async () => {
    const db = new MemoryDb();
    db.users.push({ id: 'admin', fullName: 'Admin Test', role: 'admin', adminDashboardAccess: true });
    db.leads.push({ id: 'old', leadRef: 'PL-0008', companyNameNormalised: 'already there', websiteDomain: null, ownerId: 'admin', archivedAt: null });
    db.contacts.push({ id: 'old-c', leadId: 'old', emailNormalised: 'ada@example.test' });
    const service = new PartnershipsService(db as any, { userHasPermission: async () => true } as any);
    const first = await service.commitImport('admin', csv, { ownerId: 'admin', rows: [{ importKey: 'pde-sheet:test law', importAnyway: true }] });
    expect(first.created.map((row) => row.companyName)).toEqual(['Test QS Ltd']);
    expect(first.skipped.map((row) => row.reason).join(' ')).toContain('Matches PL-0008');
    const second = await service.commitImport('admin', csv, { ownerId: 'admin' });
    expect(second.created).toHaveLength(0);
    expect(second.skipped.map((row) => row.reason).join(' ')).toContain('Already imported');
    expect(second.skipped.map((row) => row.reason).join(' ')).toContain('Matches PL-0008');
  });
});

class MemoryDb {
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

  private rows(name: string) {
    return (this as any)[name] as any[];
  }

  private box(name: string) {
    const self = this;
    return {
      async findMany(args: any = {}) {
        return self.rows(name).filter((row) => !args.where || Object.entries(args.where).every(([key, value]) => {
          if (value && typeof value === 'object' && 'not' in (value as any)) return row[key] !== (value as any).not;
          return row[key] === value;
        })).map((row) => args.include?.contacts ? { ...row, contacts: self.contacts.filter((contact) => contact.leadId === row.id) } : { ...row });
      },
      async findUnique(args: any) {
        const found = self.rows(name).find((row) => Object.entries(args.where).every(([key, value]) => row[key] === value));
        return found ? { ...found } : null;
      },
      async create(args: any) {
        const row = { id: `${name}-${self.rows(name).length + 1}`, ...args.data };
        self.rows(name).push(row);
        return row;
      },
      async update() {
        return {};
      },
    };
  }

  partnershipLead = this.box('leads');
  partnershipContact = this.box('contacts');
  partnershipTouch = this.box('touches');
  partnershipMeeting = this.box('meetings');
  partnershipStageChange = this.box('stageChanges');
  partnershipAuditLog = this.box('audits');
  user = this.box('users');
  referrer = this.box('referrers');
  partnerAgreement = this.box('agreements');
  referralClick = { count: async () => 0 };
  customerAttribution = this.box('attributions');
  partnerCommission = this.box('commissions');
  project = this.box('projects');
  $transaction = async (fn: any) => fn(this);
}

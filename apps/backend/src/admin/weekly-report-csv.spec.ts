import { toWeeklyReportCsv } from './weekly-report-csv';
import type { WeeklyReport } from './weekly-report.service';

function report(overrides: Partial<WeeklyReport> = {}): WeeklyReport {
  return {
    weekStart: '2026-11-02',
    weekEnd: '2026-11-08',
    generatedAt: '2026-11-09T07:00:00.000Z',
    sections: [
      {
        key: 'money',
        title: 'Money',
        lines: [
          { key: 'money_in', label: 'Received from homeowners', value: 2400000, unit: 'naira', status: 'ok', note: 'Ada, "quoted"' },
        ],
      },
    ],
    jobs: [
      {
        projectId: 'p1',
        name: 'Lekki, duplex',
        homeownerName: 'Ada "A"',
        gcName: 'Example GC',
        status: 'active',
        dormant: false,
        stagesApproved: 1,
        photosAdded: 2,
        photosOnSite: 2,
        photosReused: 0,
        moneyIn: 2400000,
        sentToContractor: 900000,
        paidToShopsForMaterials: 410000,
        paidToTeamMembers: 180000,
        invoicedNotPaid: 340000,
        stillWithBuildMyHouse: 3900000,
        openDisputes: 0,
      },
    ],
    ...overrides,
  };
}

describe('weekly report csv', () => {
  it('csv has one row per job then the section lines', () => {
    const csv = toWeeklyReportCsv(report());
    const lines = csv.split('\n');
    expect(lines[0].startsWith('projectId,name,')).toBe(true);
    expect(lines[1]).toContain('p1');
    expect(lines[2]).toBe('');
    expect(lines[3]).toBe('section,line,value,status,note');
    expect(lines[4]).toContain('money');
    expect(lines[4]).toContain('Received from homeowners');
  });

  it('csv quotes commas, quotes and new lines', () => {
    const csv = toWeeklyReportCsv(report({
      jobs: [{ ...report().jobs[0], gcName: 'Example\nGC' }],
    }));
    expect(csv).toContain('"Lekki, duplex"');
    expect(csv).toContain('"Ada ""A"""');
    expect(csv).toContain('"Example\nGC"');
    expect(csv).toContain('"Ada, ""quoted"""');
  });

  it('csv amounts have no naira sign or thousands separators', () => {
    const csv = toWeeklyReportCsv(report());
    expect(csv).toContain('2400000');
    expect(csv).not.toContain('₦');
    expect(csv).not.toContain('2,400,000');
  });
});

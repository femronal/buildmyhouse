import { BadRequestException } from '@nestjs/common';
import {
  materialPayWrite,
  stageBmhPaidAmount,
  summarizeJobMoney,
  teamPayWrite,
} from './job-money';

const bedStage = {
  estimatedCost: 130000,
  materials: [
    { name: 'Transport', payeeKind: 'artisan', status: 'paid', totalPrice: 15000 },
    { name: 'Foam', payeeKind: 'shop', status: 'paid', totalPrice: 30000 },
    { name: 'Fabric', payeeKind: 'shop', status: 'invoiced', totalPrice: 19800 },
    { name: 'Hardware', payeeKind: 'shop', status: 'invoiced', totalPrice: 11600 },
    { name: 'Cutting', payeeKind: 'artisan', status: 'planned', totalPrice: 2500 },
    { name: 'Wood', payeeKind: 'artisan', status: 'rejected', totalPrice: 47000 },
  ],
  teamMembers: [],
};

describe('job money payout sums', () => {
  it('counts only paid artisan and shop lines for the bed stage example', () => {
    const money = summarizeJobMoney({ budget: 130000, stages: [bedStage], payments: [] });
    expect(money.paidToYou).toBe(15000);
    expect(money.paidToShops).toBe(30000);
    expect(money.leftOnThisJob).toBe(85000);
    expect(money.fullJobPrice).toBe(130000);
    expect(money.otherPaid).toBe(0);
    expect(money.earned).toBe(15000);
    expect(money.pending).toBe(85000);
    expect(money.hasHomeownerReceipts).toBe(false);
  });

  it('counts a paid artisan and shop line when the saved words differ in case or the total was left at zero', () => {
    const money = summarizeJobMoney({
      budget: 336000,
      stages: [{
        materials: [
          { payeeKind: 'Artisan', status: 'Paid', totalPrice: 0, quantity: 1, unitPrice: 15000 },
          { payeeKind: ' Shop ', status: 'paid', totalPrice: 30000 },
        ],
        teamMembers: [],
      }],
      payments: [],
    });
    expect(money.sentToContractor).toBe(15000);
    expect(money.paidToShopsForMaterials).toBe(30000);
    expect(money.paidToYou).toBe(15000);
    expect(money.paidToShops).toBe(30000);
    expect(money.fullJobPrice).toBe(336000);
    expect(money.leftOnThisJob).toBe(291000);
    expect(money.hasHomeownerReceipts).toBe(false);
    expect(money.youSentIn).toBe(0);
  });

  it('keeps contractor and shop payouts when homeowner receipts are missing on the live bed job', () => {
    const money = summarizeJobMoney({ budget: 336000, stages: [bedStage], payments: [] });
    expect(money.paidToYou).toBe(15000);
    expect(money.paidToShops).toBe(30000);
    expect(money.fullJobPrice).toBe(336000);
    expect(money.leftOnThisJob).toBe(291000);
    expect(money.sentToContractor).toBe(15000);
    expect(money.paidToShopsForMaterials).toBe(30000);
    expect(money.youSentIn).toBe(0);
    expect(money.hasHomeownerReceipts).toBe(false);
  });

  it('does not add a completed stage price into paid to you', () => {
    const money = summarizeJobMoney({
      budget: 130000,
      stages: [{ ...bedStage, status: 'completed', estimatedCost: 130000 } as any],
      payments: [],
    });
    expect(money.paidToYou).toBe(15000);
    expect(money.paidToYou).not.toBe(130000);
    expect(money.paidToYou).not.toBe(145000);
  });

  it('ignores a helper the contractor paid, then counts a BMH paid helper', () => {
    const gcPaid = summarizeJobMoney({
      budget: 130000,
      stages: [{
        ...bedStage,
        teamMembers: [{ payStatus: 'paid', paidBy: 'gc', paidAmount: 5000, dailyRate: 9000 }],
      }],
      payments: [],
    });
    expect(gcPaid.paidToYou).toBe(15000);
    expect(gcPaid.paidToTeamMembers).toBe(0);
    expect(gcPaid.leftOnThisJob).toBe(85000);

    const bmhPaid = summarizeJobMoney({
      budget: 130000,
      stages: [{
        ...bedStage,
        teamMembers: [{ payStatus: 'paid', paidBy: 'bmh', paidAmount: 5000, dailyRate: 9000 }],
      }],
      payments: [],
    });
    expect(bmhPaid.paidToYou).toBe(15000);
    expect(bmhPaid.paidToTeamMembers).toBe(5000);
    expect(bmhPaid.sentToContractor).toBe(15000);
    expect(bmhPaid.leftOnThisJob).toBe(80000);
  });

  it('uses daily rate times days when a paid BMH team line has no paid amount', () => {
    const money = summarizeJobMoney({
      budget: 100000,
      stages: [{
        materials: [],
        teamMembers: [{
          payStatus: 'paid',
          paidBy: 'bmh',
          paidAmount: null,
          dailyRate: 1000,
          startDate: '2026-10-01T00:00:00.000Z',
          endDate: '2026-10-04T00:00:00.000Z',
        }],
      }],
      payments: [],
    });
    expect(money.paidToYou).toBe(0);
    expect(money.paidToTeamMembers).toBe(3000);
    expect(money.leftOnThisJob).toBe(97000);
  });

  it('builds the homeowner split from completed payments and paid lines', () => {
    const missing = summarizeJobMoney({ budget: 130000, stages: [bedStage], payments: [{ status: 'pending', amount: 130000 }] });
    expect(missing.hasHomeownerReceipts).toBe(false);

    const money = summarizeJobMoney({
      budget: 130000,
      stages: [bedStage],
      payments: [
        { id: 'pay-1', status: 'completed', amount: 100000, method: 'manual' },
        { id: 'pay-2', status: 'failed', amount: 5000 },
      ],
    });
    expect(money.youSentIn).toBe(100000);
    expect(money.sentToContractor).toBe(15000);
    expect(money.paidToShopsForMaterials).toBe(30000);
    expect(money.stillWithBuildMyHouse).toBe(55000);
    expect(money.receipts.map((row) => row.id)).toEqual(['pay-1']);
  });

  it('subtracts other paid lines from money left on the job and still with BuildMyHouse', () => {
    const money = summarizeJobMoney({
      budget: 130000,
      stages: [{
        materials: [
          { payeeKind: 'artisan', status: 'paid', totalPrice: 15000 },
          { payeeKind: 'shop', status: 'paid', totalPrice: 30000 },
          { payeeKind: 'other', status: 'paid', totalPrice: 5000 },
        ],
        teamMembers: [],
      }],
      payments: [{ id: 'pay-1', status: 'completed', amount: 100000 }],
    });
    expect(money.paidToYou).toBe(15000);
    expect(money.leftOnThisJob).toBe(80000);
    expect(money.stillWithBuildMyHouse).toBe(50000);
  });

  it('subtracts a refund from you sent in and keeps team pay on its own line', () => {
    const money = summarizeJobMoney({
      budget: 100000,
      stages: [{
        materials: [{ payeeKind: 'artisan', status: 'paid', totalPrice: 10000 }],
        teamMembers: [{ payStatus: 'paid', paidBy: 'bmh', paidAmount: 4000 }],
      }],
      payments: [
        { id: 'pay-1', status: 'completed', amount: 130000 },
        { id: 'pay-2', status: 'refunded', amount: 10000 },
      ],
    });
    expect(money.youSentIn).toBe(120000);
    expect(money.sentToContractor).toBe(10000);
    expect(money.paidToTeamMembers).toBe(4000);
    expect(money.stillWithBuildMyHouse).toBe(106000);
    expect(money.hasHomeownerReceipts).toBe(true);
  });

  it('warns in numbers when BMH paid lines pass the stage price', () => {
    expect(stageBmhPaidAmount(bedStage)).toBe(45000);
    expect(stageBmhPaidAmount({
      estimatedCost: 1000,
      materials: [{ payeeKind: 'shop', status: 'paid', totalPrice: 800 }],
      teamMembers: [{ payStatus: 'paid', paidBy: 'bmh', paidAmount: 400 }],
    })).toBe(1200);
  });

  it('sets paidAt when a line is paid and clears it when the status moves back', () => {
    const paid = materialPayWrite({ payeeKind: 'artisan', status: 'paid' }, undefined, 'create');
    expect(paid.paidAt).toBeInstanceOf(Date);
    const reverted = materialPayWrite({ status: 'invoiced' }, { status: 'paid', paidAt: paid.paidAt }, 'update');
    expect(reverted.status).toBe('invoiced');
    expect(reverted.paidAt).toBeNull();
  });

  it('requires who paid when a team line is paid', () => {
    expect(() => teamPayWrite({ payStatus: 'paid', paidAmount: 5000 }, undefined, 'update')).toThrow(BadRequestException);
    const gc = teamPayWrite({ payStatus: 'paid', paidBy: 'gc', paidAmount: 5000 }, undefined, 'update');
    expect(gc.paidBy).toBe('gc');
    expect(gc.paidAt).toBeInstanceOf(Date);
    const cleared = teamPayWrite({ payStatus: 'planned' }, { payStatus: 'paid', paidBy: 'gc', paidAt: new Date() }, 'update');
    expect(cleared.paidAt).toBeNull();
  });
});

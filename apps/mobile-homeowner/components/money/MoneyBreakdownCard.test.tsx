import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import MoneyBreakdownCard from './MoneyBreakdownCard';

function renderCard(summary: React.ComponentProps<typeof MoneyBreakdownCard>['summary']) {
  let tree: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<MoneyBreakdownCard summary={summary} />);
  });
  return tree!;
}

describe('MoneyBreakdownCard', () => {
  it('prints the five money labels', () => {
    const tree = renderCard({
      hasHomeownerReceipts: true,
      youSentIn: 19500,
      stillWithBuildMyHouse: 14500,
      sentToContractor: 0,
      paidToShopsForMaterials: 3000,
      paidToTeamMembers: 2000,
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Your money on this job');
    expect(text).toContain('You sent in');
    expect(text).toContain('Still with BuildMyHouse');
    expect(text).toContain('Sent to your contractor');
    expect(text).toContain('Paid to shops for materials');
    expect(text).toContain('Paid to team members');
    expect(text.toLowerCase()).not.toContain(['esc', 'row'].join(''));
    expect(text).not.toContain(['Wait', 'ing'].join(''));
    act(() => {
      tree.unmount();
    });
  });

  it('says there are not enough records when no receipt has been recorded', () => {
    const tree = renderCard({
      hasHomeownerReceipts: false,
      youSentIn: 0,
      sentToContractor: 0,
      paidToShopsForMaterials: 0,
      paidToTeamMembers: 0,
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Not enough records yet');
    expect(text.toLowerCase()).not.toContain(['esc', 'row'].join(''));
    expect(text).not.toContain(['Wait', 'ing'].join(''));
    act(() => {
      tree.unmount();
    });
  });
});

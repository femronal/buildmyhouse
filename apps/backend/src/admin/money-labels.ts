export const MONEY_LABELS = {
  sentToContractor: 'Sent to contractor',
  paidToShopsForMaterials: 'Paid to shops for materials',
  paidToTeamMembers: 'Paid to team members',
  stillWithBuildMyHouse: 'Still with BuildMyHouse',
  moneyMoved: 'Money moved',
  leftOnThisJob: 'Left on this job',
} as const;

// BMH Compliance Watch must approve these two labels. Rename here only.
export const PENDING_APPROVAL_MONEY_LABELS = {
  moneyIn: 'Received from homeowners',
  invoicedNotPaid: 'Invoiced, not yet paid',
} as const;

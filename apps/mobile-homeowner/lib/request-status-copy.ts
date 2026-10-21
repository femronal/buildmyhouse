// Money wording: check with BMH Compliance Watch
export const REQUEST_STATUS_COPY = {
  estimateNote: 'This is only an estimate. The final price comes after inspection.',
  safety: 'Never pay the contractor anything except the agreed inspection fee. All other payments go to BuildMyHouse.',
  steps: [
    {
      title: 'Request sent',
      detail: 'Nothing. Wait for the contractor to contact you.',
    },
    {
      title: 'Contractor contact',
      detail: 'The contractor will call or WhatsApp you within 24 to 48 hours.',
      now: 'Agree the inspection date and the inspection fee before the visit.',
      confirm: 'When the contractor contacts you, tap Yes.',
    },
    {
      title: 'Inspection',
      detail: 'The contractor visits your site.',
      now: 'Be on site. Pay only the agreed inspection fee to the contractor.',
    },
    {
      title: 'Quote agreed',
      detail: 'The contractor sends the scope from the inspection.',
      now: 'Check the stages and the signed quote. Accept the scope, or say it is not the quote you signed.',
    },
    {
      title: 'BMH check',
      detail: 'BuildMyHouse checks the quote is fair and adds a contingency.',
      now: 'Nothing. We will message you.',
    },
    {
      title: 'Accepted',
      detail: 'Your project is approved.',
      now: 'Fund your project through BuildMyHouse to start.',
    },
  ],
  late: 'We are following this up for you.',
  // Femi to confirm before shipping
  declinedBefore:
    "This contractor can't take your project right now. That's okay, you can choose another contractor.",
  // Femi to confirm before shipping
  declinedAfter:
    "This contractor can't take your project. The inspection fee is not refunded, but you keep the inspection findings. BuildMyHouse can connect you with another verified contractor for the same plan.",
  whatsappHelp: 'https://wa.me/2348139036559',
};

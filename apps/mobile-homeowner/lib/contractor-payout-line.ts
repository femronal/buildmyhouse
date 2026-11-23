import { formatNaira } from './money-breakdown';

export function formatContractorPayoutLine(p: { amount: number; gcName: string; sentAt: string; bankReference: string }): string {
  const date = new Date(p.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${formatNaira(p.amount)} sent to ${p.gcName} on ${date} · ref ${p.bankReference}`;
}

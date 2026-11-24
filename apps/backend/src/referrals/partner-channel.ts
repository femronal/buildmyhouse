export const TYPED_CODE_CHANNEL = 'word_of_mouth' as const;

export type PartnerChannel = 'word_of_mouth' | 'online' | 'not_split';

export function channelFor(attribution: { channel: string | null; source: string }): PartnerChannel {
  if (attribution.channel === 'word_of_mouth' || attribution.channel === 'online') return attribution.channel;
  if (attribution.source === 'code_entered') return TYPED_CODE_CHANNEL;
  return 'not_split';
}

import { Text, View } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import {
  buildMoneyBarLabel,
  buildMoneyBreakdown,
  formatNaira,
  type MoneySummaryInput,
} from '@/lib/money-breakdown';

type MoneyBreakdownCardProps = {
  summary?: MoneySummaryInput | null;
  /** Tighter type and padding for the landing-page phone, where the card is about 290px wide. */
  compact?: boolean;
};

export default function MoneyBreakdownCard({ summary, compact = false }: MoneyBreakdownCardProps) {
  const breakdown = buildMoneyBreakdown(summary);
  const barSegments = breakdown.segments.filter((segment) => segment.widthPct > 0);

  return (
    <View
      style={[
        cardShadowStyle,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E6E6E6',
          padding: compact ? 14 : 20,
          width: '100%',
          maxWidth: 900,
          alignSelf: 'center',
        },
      ]}
    >
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: compact ? 16 : 18, color: '#111111' }}>
        Your money on this job
      </Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: compact ? 12 : 14, color: '#6B7280', marginTop: compact ? 10 : 16 }}>
        You sent in
      </Text>
      <Text
        style={{
          fontFamily: breakdown.hasReceipts ? 'JetBrainsMono_500Medium' : 'Poppins_400Regular',
          fontSize: breakdown.hasReceipts ? (compact ? 28 : 34) : 16,
          color: '#111111',
          marginTop: 4,
        }}
      >
        {breakdown.hasReceipts ? formatNaira(breakdown.youSentIn) : 'Not enough records yet'}
      </Text>

      {breakdown.showBar ? (
        <View style={{ marginTop: compact ? 12 : 16 }}>
          <View
            accessibilityRole="image"
            accessibilityLabel={buildMoneyBarLabel(breakdown)}
            style={{
              height: compact ? 14 : 18,
              borderRadius: 999,
              backgroundColor: '#EEEEEE',
              overflow: 'hidden',
              flexDirection: 'row',
            }}
          >
            {barSegments.map((segment, index) => (
              <View
                key={segment.key}
                style={{ width: `${segment.widthPct}%`, height: '100%' }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: segment.color,
                    marginRight: index < barSegments.length - 1 ? 2 : 0,
                  }}
                />
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280', marginTop: 8 }}>
            {breakdown.hasReceipts
              ? 'Bar shows where every naira you sent in is now.'
              : 'Bar shows how the money paid out so far is split.'}
          </Text>
        </View>
      ) : null}

      {breakdown.overPaid ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6B7280', marginTop: 8 }}>
          Paid out is more than the receipts recorded so far.
        </Text>
      ) : null}

      <View style={{ marginTop: 8 }}>
        {breakdown.segments.map((segment) => {
          const unknownStill = segment.key === 'still' && !breakdown.hasReceipts;
          const muted = !unknownStill && segment.amount <= 0;
          const amountLabel = unknownStill ? 'Not enough records yet' : formatNaira(segment.amount);
          const percentLabel = segment.pct == null ? '' : `${segment.pct}%`;
          const rowLabel = percentLabel
            ? `${segment.label}, ${amountLabel}, ${percentLabel}`
            : `${segment.label}, ${amountLabel}`;
          return (
            <View
              key={segment.key}
              accessible
              accessibilityLabel={rowLabel}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: compact ? 8 : 12,
                borderTopWidth: 1,
                borderTopColor: '#EEEEEE',
              }}
            >
              <View
                style={{
                  width: compact ? 8 : 10,
                  height: compact ? 8 : 10,
                  borderRadius: 5,
                  backgroundColor: segment.color,
                  marginRight: compact ? 8 : 10,
                }}
              />
              <View style={{ flex: 1, marginRight: compact ? 8 : 12, minWidth: 0 }}>
                <Text
                  style={{
                    fontFamily: 'Poppins_400Regular',
                    fontSize: compact ? 13 : 15,
                    lineHeight: compact ? 17 : undefined,
                    color: '#111111',
                  }}
                >
                  {segment.label}
                </Text>
              </View>
              <Text
                numberOfLines={compact ? 1 : undefined}
                style={{
                  flexShrink: compact ? 0 : 1,
                  textAlign: 'right',
                  maxWidth: compact ? undefined : '46%',
                  fontFamily: unknownStill ? 'Poppins_400Regular' : 'JetBrainsMono_500Medium',
                  fontSize: compact ? 13 : 15,
                  color: muted ? '#B0B0B0' : '#111111',
                }}
              >
                {amountLabel}
              </Text>
              {segment.pct != null ? (
                <Text
                  style={{
                    width: compact ? 34 : 44,
                    marginLeft: compact ? 6 : 10,
                    textAlign: 'right',
                    fontFamily: 'Poppins_400Regular',
                    fontSize: compact ? 12 : 14,
                    color: '#9A9A9A',
                  }}
                >
                  {percentLabel}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

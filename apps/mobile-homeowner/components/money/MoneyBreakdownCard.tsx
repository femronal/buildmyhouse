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
};

export default function MoneyBreakdownCard({ summary }: MoneyBreakdownCardProps) {
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
          padding: 20,
          width: '100%',
          maxWidth: 900,
          alignSelf: 'center',
        },
      ]}
    >
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#111111' }}>
        Your money on this job
      </Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#6B7280', marginTop: 16 }}>
        You sent in
      </Text>
      <Text
        style={{
          fontFamily: breakdown.hasReceipts ? 'JetBrainsMono_500Medium' : 'Poppins_400Regular',
          fontSize: breakdown.hasReceipts ? 34 : 16,
          color: '#111111',
          marginTop: 4,
        }}
      >
        {breakdown.hasReceipts ? formatNaira(breakdown.youSentIn) : 'Not enough records yet'}
      </Text>

      {breakdown.showBar ? (
        <View style={{ marginTop: 16 }}>
          <View
            accessibilityRole="image"
            accessibilityLabel={buildMoneyBarLabel(breakdown)}
            style={{
              height: 18,
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
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: '#EEEEEE',
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: segment.color,
                  marginRight: 10,
                }}
              />
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 15,
                    color: '#111111',
                  }}
                >
                  {segment.label}
                </Text>
              </View>
              <Text
                style={{
                  flexShrink: 1,
                  textAlign: 'right',
                  maxWidth: '46%',
                  fontFamily: unknownStill ? 'Poppins_400Regular' : 'JetBrainsMono_500Medium',
                  fontSize: 15,
                  color: muted ? '#B0B0B0' : '#111111',
                }}
              >
                {amountLabel}
              </Text>
              {segment.pct != null ? (
                <Text
                  style={{
                    width: 44,
                    marginLeft: 10,
                    textAlign: 'right',
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 14,
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

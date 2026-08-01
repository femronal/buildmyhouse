import { Text, View } from 'react-native';
import { UnderstandingRow } from '@/lib/price-checker/state';
import { pc } from './theme';

type Props = {
  rows: UnderstandingRow[];
  emptyHint?: string;
};

function stateLabel(state: UnderstandingRow['state']): string {
  switch (state) {
    case 'provided':
      return '';
    case 'unknown':
      return 'Not sure yet';
    case 'needed':
      return 'Still needed';
    case 'optional':
      return 'Optional';
  }
}

export function ProductUnderstandingPanel({ rows, emptyHint }: Props) {
  return (
    <View
      className="flex-1 rounded-[2rem] border p-6 md:p-8"
      style={{
        backgroundColor: pc.charcoalSoft,
        borderColor: pc.panelBorder,
        minHeight: 220,
      }}
      accessibilityRole="summary"
      accessibilityLabel="What we understand about your price check"
    >
      <Text className="mb-5 text-xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
        What we understand
      </Text>
      {rows.length === 0 ? (
        <Text className="text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
          {emptyHint ??
            'Search for a building material to begin. Confirmed product details will appear here as you answer.'}
        </Text>
      ) : (
        <View className="gap-3">
          {rows.map((row) => (
            <View
              key={row.key}
              className="flex-row items-start justify-between gap-3 border-b border-white/5 pb-3"
            >
              <Text className="w-1/3 text-xs uppercase tracking-wide text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {row.label}
              </Text>
              <Text
                className="flex-1 text-right text-sm"
                style={{
                  fontFamily: 'Poppins_500Medium',
                  color: row.state === 'provided' ? '#f8fafc' : row.state === 'unknown' ? '#fbbf24' : '#64748b',
                }}
              >
                {row.value ?? stateLabel(row.state)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

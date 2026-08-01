import { Pressable, Text, View } from 'react-native';
import { ConsumerReportDto } from '@/lib/price-checker/types';
import { confidenceTone, getPriceCheckerDensity, pc } from './theme';

function money(currency: string | null, amount: number | null): string {
  if (amount === null) return '—';
  const prefix = currency === 'NGN' || !currency ? '₦' : `${currency} `;
  return `${prefix}${amount.toLocaleString('en-NG')}`;
}

type Props = {
  summary: Pick<ConsumerReportDto, 'product' | 'location' | 'pricing' | 'confidence' | 'status' | 'generatedAt'>;
  onOpenReport: () => void;
  onDownloadPdf: () => void;
  onStartAnother: () => void;
  pdfReady?: boolean;
  compact?: boolean;
};

export function ReportReadyPanel({
  summary,
  onOpenReport,
  onDownloadPdf,
  onStartAnother,
  pdfReady = true,
  compact = false,
}: Props) {
  const tone = confidenceTone(summary.confidence.label);
  const density = getPriceCheckerDensity(compact ? 390 : 1024);

  return (
    <View style={{ width: '100%', maxWidth: '100%' }}>
      <Text
        style={{
          fontFamily: 'Poppins_500Medium',
          fontSize: density.titleSize,
          lineHeight: density.titleLineHeight,
          color: '#fff',
          marginBottom: 8,
        }}
      >
        Your price report is ready
      </Text>
      <Text
        style={{
          fontFamily: 'Poppins_400Regular',
          fontSize: density.bodySize,
          lineHeight: density.bodyLineHeight,
          color: '#94a3b8',
          marginBottom: compact ? 14 : 20,
        }}
      >
        We found enough traceable evidence to prepare a price range for your request.
      </Text>

      <View
        style={{
          marginBottom: compact ? 14 : 24,
          gap: 6,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.05)',
          padding: compact ? 12 : 16,
          backgroundColor: pc.charcoalDeep,
        }}
      >
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#fff', fontSize: compact ? 14 : 16 }}>
          {summary.product.name}
        </Text>
        <Text style={{ fontSize: density.bodySize, color: '#94a3b8' }}>{summary.location.requested}</Text>
        {summary.status === 'single_source' ? (
          <Text style={{ fontSize: density.bodySize, color: '#fff' }}>
            Single-source observed price: {money(summary.pricing.currency, summary.pricing.singleSourcePrice)}
          </Text>
        ) : (
          <>
            <Text style={{ fontSize: density.bodySize, color: '#fff' }}>
              Observed range: {money(summary.pricing.currency, summary.pricing.observedLow)} –{' '}
              {money(summary.pricing.currency, summary.pricing.observedHigh)}
              {summary.pricing.normalisedUnit ? ` per ${summary.pricing.normalisedUnit}` : ''}
            </Text>
            <Text style={{ fontSize: density.bodySize, color: '#fff' }}>
              Typical observed price: {money(summary.pricing.currency, summary.pricing.typicalPrice)}
            </Text>
          </>
        )}
        <View
          style={{
            marginTop: 4,
            alignSelf: 'flex-start',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: tone.bg,
            borderWidth: 1,
            borderColor: tone.border,
            maxWidth: '100%',
          }}
        >
          <Text style={{ color: tone.fg, fontFamily: 'Poppins_600SemiBold', fontSize: compact ? 11 : 12 }}>
            {summary.confidence.label} · {summary.confidence.score}/100 · {summary.pricing.independentSourceCount}{' '}
            independent sources
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOpenReport}
        accessibilityRole="link"
        accessibilityLabel="Open report in a new tab"
        style={{
          marginBottom: 10,
          minHeight: density.buttonMinHeight,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          backgroundColor: pc.green,
        }}
      >
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: density.buttonTextSize, color: '#fff' }}>
          Open report
        </Text>
      </Pressable>
      <Pressable
        onPress={onDownloadPdf}
        disabled={!pdfReady}
        accessibilityRole="button"
        accessibilityLabel="Download PDF"
        style={{
          marginBottom: 10,
          minHeight: density.buttonMinHeight,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
          opacity: pdfReady ? 1 : 0.5,
        }}
      >
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: density.buttonTextSize, color: '#fff' }}>
          {pdfReady ? 'Download PDF' : 'PDF still being prepared'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onStartAnother}
        accessibilityRole="button"
        style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: density.bodySize, color: '#94a3b8' }}>
          Start another price check
        </Text>
      </Pressable>
    </View>
  );
}

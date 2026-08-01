import { Pressable, Text, View } from 'react-native';
import { ConsumerReportDto } from '@/lib/price-checker/types';
import { confidenceTone, pc } from './theme';

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
};

export function ReportReadyPanel({ summary, onOpenReport, onDownloadPdf, onStartAnother, pdfReady = true }: Props) {
  const tone = confidenceTone(summary.confidence.label);
  return (
    <View>
      <Text className="mb-2 text-2xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
        Your price report is ready
      </Text>
      <Text className="mb-5 text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
        We found enough traceable evidence to prepare a price range for your request.
      </Text>

      <View className="mb-6 gap-2 rounded-2xl border border-white/5 p-4" style={{ backgroundColor: pc.charcoalDeep }}>
        <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {summary.product.name}
        </Text>
        <Text className="text-sm text-slate-400">{summary.location.requested}</Text>
        {summary.status === 'single_source' ? (
          <Text className="text-sm text-white">
            Single-source observed price: {money(summary.pricing.currency, summary.pricing.singleSourcePrice)}
          </Text>
        ) : (
          <>
            <Text className="text-sm text-white">
              Observed range: {money(summary.pricing.currency, summary.pricing.observedLow)} –{' '}
              {money(summary.pricing.currency, summary.pricing.observedHigh)}
              {summary.pricing.normalisedUnit ? ` per ${summary.pricing.normalisedUnit}` : ''}
            </Text>
            <Text className="text-sm text-white">
              Typical observed price: {money(summary.pricing.currency, summary.pricing.typicalPrice)}
            </Text>
          </>
        )}
        <View className="mt-1 self-start rounded-full px-3 py-1" style={{ backgroundColor: tone.bg, borderWidth: 1, borderColor: tone.border }}>
          <Text style={{ color: tone.fg, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>
            {summary.confidence.label} · {summary.confidence.score}/100 · {summary.pricing.independentSourceCount} independent
            sources
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOpenReport}
        accessibilityRole="link"
        accessibilityLabel="Open report in a new tab"
        className="mb-3 min-h-[48px] items-center justify-center rounded-2xl"
        style={{ backgroundColor: pc.green }}
      >
        <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Open report
        </Text>
      </Pressable>
      <Pressable
        onPress={onDownloadPdf}
        disabled={!pdfReady}
        accessibilityRole="button"
        accessibilityLabel="Download PDF"
        className="mb-3 min-h-[48px] items-center justify-center rounded-2xl border border-white/15"
        style={{ opacity: pdfReady ? 1 : 0.5 }}
      >
        <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {pdfReady ? 'Download PDF' : 'PDF still being prepared'}
        </Text>
      </Pressable>
      <Pressable onPress={onStartAnother} accessibilityRole="button" className="min-h-[44px] items-center justify-center">
        <Text className="text-sm text-slate-400" style={{ fontFamily: 'Poppins_500Medium' }}>
          Start another price check
        </Text>
      </Pressable>
    </View>
  );
}

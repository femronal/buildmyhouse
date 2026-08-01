import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { priceCheckerAnalytics } from '@/lib/price-checker/analytics';
import { ConsumerReportDto } from '@/lib/price-checker/types';
import { buildManualMarketCheckWhatsAppUrl } from '@/lib/whatsapp-support';
import { pc } from './theme';

type Props = {
  report: ConsumerReportDto | null;
  productName: string | null;
  locationLabel: string | null;
  onEdit: () => void;
  onOpenReport: () => void;
  onStartAnother: () => void;
};

export function InsufficientDataPanel({ report, productName, locationLabel, onEdit, onOpenReport, onStartAnother }: Props) {
  return (
    <View>
      <Text className="mb-2 text-2xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
        We could not confirm a reliable price range yet
      </Text>
      <Text className="mb-5 text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
        {report?.insufficientData?.explanation ??
          `The available sources did not provide enough matching and traceable evidence for ${productName ?? 'this request'}${
            locationLabel ? ` in ${locationLabel}` : ''
          }.`}
      </Text>

      {report?.insufficientData?.missingData?.length ? (
        <View className="mb-5">
          <Text className="mb-2 text-xs uppercase text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            What was missing
          </Text>
          {report.insufficientData.missingData.map((item) => (
            <Text key={item} className="mb-1 text-sm text-slate-300" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}

      {report?.status === 'single_source' || (report?.pricing.singleSourcePrice != null && report.status !== 'complete') ? (
        <Text className="mb-4 text-sm text-amber-200" style={{ fontFamily: 'Poppins_400Regular' }}>
          One observed price may be available in the full report. It is not a market range.
        </Text>
      ) : null}

      <Pressable
        onPress={async () => {
          priceCheckerAnalytics.manualCheckRequested('workspace');
          const url = buildManualMarketCheckWhatsAppUrl({
            productName: report?.product.name ?? productName ?? 'a building material',
            brand: report?.product.brand,
            specification: report?.product.specification,
            unit: report?.product.requestedUnit,
            location: report?.location.requested ?? locationLabel,
            reportRef: report ? report.reportId.slice(0, 8) : null,
          });
          if (Platform.OS === 'web') window.open(url, '_blank', 'noopener,noreferrer');
          else await Linking.openURL(url);
        }}
        className="mb-3 min-h-[48px] items-center justify-center rounded-2xl"
        style={{ backgroundColor: pc.green }}
        accessibilityRole="link"
        accessibilityLabel="Request a verified local market check on WhatsApp"
      >
        <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Request a verified local market check
        </Text>
      </Pressable>
      <Pressable
        onPress={onEdit}
        className="mb-3 min-h-[48px] items-center justify-center rounded-2xl border border-white/15"
        accessibilityRole="button"
        accessibilityLabel="Edit your request"
      >
        <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Edit your request
        </Text>
      </Pressable>
      {report ? (
        <Pressable
          onPress={onOpenReport}
          className="mb-3 min-h-[48px] items-center justify-center rounded-2xl border border-white/15"
          accessibilityRole="link"
        >
          <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            View details
          </Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onStartAnother} className="min-h-[44px] items-center justify-center" accessibilityRole="button">
        <Text className="text-sm text-slate-400" style={{ fontFamily: 'Poppins_500Medium' }}>
          Start another price check
        </Text>
      </Pressable>
    </View>
  );
}

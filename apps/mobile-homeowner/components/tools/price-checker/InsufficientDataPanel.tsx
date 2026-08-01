import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { priceCheckerAnalytics } from '@/lib/price-checker/analytics';
import { ConsumerReportDto } from '@/lib/price-checker/types';
import { buildManualMarketCheckWhatsAppUrl } from '@/lib/whatsapp-support';
import { getPriceCheckerDensity, pc } from './theme';

type Props = {
  report: ConsumerReportDto | null;
  productName: string | null;
  locationLabel: string | null;
  onEdit: () => void;
  onOpenReport: () => void;
  onStartAnother: () => void;
  compact?: boolean;
};

export function InsufficientDataPanel({
  report,
  productName,
  locationLabel,
  onEdit,
  onOpenReport,
  onStartAnother,
  compact = false,
}: Props) {
  const density = getPriceCheckerDensity(compact ? 390 : 1024);

  const btn = (label: string, onPress: () => void, primary?: boolean, a11y?: string) => (
    <Pressable
      onPress={onPress}
      accessibilityRole={primary ? 'link' : 'button'}
      accessibilityLabel={a11y ?? label}
      style={{
        marginBottom: 10,
        minHeight: density.buttonMinHeight,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: primary ? pc.green : 'transparent',
        borderWidth: primary ? 0 : 1,
        borderColor: 'rgba(255,255,255,0.15)',
        width: '100%',
      }}
    >
      <Text
        style={{
          fontFamily: 'Poppins_600SemiBold',
          fontSize: density.buttonTextSize,
          lineHeight: density.buttonTextSize + 4,
          color: '#fff',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

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
        We could not confirm a reliable price range yet
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
        {report?.insufficientData?.explanation ??
          `The available sources did not provide enough matching and traceable evidence for ${productName ?? 'this request'}${
            locationLabel ? ` in ${locationLabel}` : ''
          }.`}
      </Text>

      {report?.insufficientData?.missingData?.length ? (
        <View style={{ marginBottom: compact ? 14 : 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins_600SemiBold',
              fontSize: density.labelSize,
              color: '#64748b',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            What was missing
          </Text>
          {report.insufficientData.missingData.map((item) => (
            <Text
              key={item}
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: density.bodySize,
                lineHeight: density.bodyLineHeight,
                color: '#cbd5e1',
                marginBottom: 4,
              }}
            >
              • {item}
            </Text>
          ))}
        </View>
      ) : null}

      {report?.status === 'single_source' || (report?.pricing.singleSourcePrice != null && report.status !== 'complete') ? (
        <Text
          style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: density.bodySize,
            color: '#fde68a',
            marginBottom: 12,
          }}
        >
          One observed price may be available in the full report. It is not a market range.
        </Text>
      ) : null}

      {btn(
        compact ? 'Request a verified market check' : 'Request a verified local market check',
        async () => {
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
        },
        true,
        'Request a verified local market check on WhatsApp',
      )}
      {btn('Edit your request', onEdit)}
      {report ? btn('View details', onOpenReport) : null}
      <Pressable
        onPress={onStartAnother}
        style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center' }}
        accessibilityRole="button"
      >
        <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: density.bodySize, color: '#94a3b8' }}>
          Start another price check
        </Text>
      </Pressable>
    </View>
  );
}

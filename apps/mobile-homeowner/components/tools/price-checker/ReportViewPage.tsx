import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'phosphor-react-native';
import { priceCheckerApi } from '@/lib/price-checker/api';
import { priceCheckerAnalytics } from '@/lib/price-checker/analytics';
import { downloadPriceCheckerPdf } from '@/lib/price-checker/download-pdf';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { requireAuthToContinue } from '@/lib/require-auth-to-continue';
import { useWebSeo } from '@/lib/seo';
import { buildManualMarketCheckWhatsAppUrl } from '@/lib/whatsapp-support';
import { confidenceTone, pc } from './theme';

function money(currency: string | null, amount: number | null): string {
  if (amount === null) return '—';
  const prefix = currency === 'NGN' || !currency ? '₦' : `${currency} `;
  return `${prefix}${amount.toLocaleString('en-NG')}`;
}

export default function ReportViewPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reportId: string; token?: string }>();
  const reportId = typeof params.reportId === 'string' ? params.reportId : '';
  const token = typeof params.token === 'string' ? params.token : null;
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const autoSaveAttempted = useRef(false);

  const reportPath = priceCheckerApi.reportPath(reportId, token);

  useWebSeo({
    title: 'Price Report | BuildMyHouse Price Checker',
    description: 'Source-backed building material price report from BuildMyHouse.',
    canonicalPath: `/tools/price-checker/reports/${reportId}`,
    robots: 'noindex,nofollow',
  });

  const query = useQuery({
    queryKey: ['priceCheckerReport', reportId, token],
    queryFn: async () => {
      const dto = await priceCheckerApi.getReport(reportId, token);
      priceCheckerAnalytics.reportOpened(dto.status);
      return dto;
    },
    enabled: Boolean(reportId),
    retry: 1,
  });

  const report = query.data;
  const tone = report ? confidenceTone(report.confidence.label) : null;
  const isSaved = Boolean(report?.savedToAccount || saved);

  const persistToAccount = async (): Promise<boolean> => {
    if (!reportId || isSaved) return true;
    setSaving(true);
    try {
      await priceCheckerApi.saveReport(reportId, token);
      setSaved(true);
      priceCheckerAnalytics.reportSaved();
      await query.refetch();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this report.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(message);
      else Alert.alert('Save failed', message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // After sign-in return (or when already signed in), attach the report to the account once.
  useEffect(() => {
    if (!report || userLoading || !user || isSaved || autoSaveAttempted.current) return;
    autoSaveAttempted.current = true;
    void persistToAccount().then((ok) => {
      if (!ok) autoSaveAttempted.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot after auth/report ready
  }, [report?.reportId, report?.savedToAccount, user?.id, userLoading, isSaved]);

  const downloadPdf = async () => {
    if (!reportId || pdfBusy) return;
    setPdfError(null);
    setPdfBusy(true);
    try {
      await downloadPriceCheckerPdf(reportId, token);
      priceCheckerAnalytics.pdfDownloaded();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF download failed. Please try again.';
      setPdfError(message);
      if (Platform.OS !== 'web') Alert.alert('Download failed', message);
    } finally {
      setPdfBusy(false);
    }
  };

  const saveReport = async () => {
    const ok = await requireAuthToContinue({
      router,
      currentUser: user,
      userLoading,
      destinationPath: reportPath,
      promptTitle: 'Sign in to save this report',
      promptMessage: 'Create a free account or sign in to keep this report in your history.',
    });
    if (!ok) {
      priceCheckerAnalytics.loginPromptViewed();
      return;
    }
    await persistToAccount();
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 64 }}>
      <View className="mx-auto w-full max-w-[760px] px-4 pt-10">
        <Pressable
          onPress={() => router.push('/tools/price-checker' as any)}
          className="mb-6 h-11 w-11 items-center justify-center rounded-full border border-neutral-200"
          accessibilityLabel="Back to Price Checker"
        >
          <ArrowLeft size={16} color="#171717" weight="bold" />
        </Pressable>

        {query.isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator color={pc.green} />
            <Text className="mt-3 text-neutral-500">Loading report…</Text>
          </View>
        ) : null}

        {query.isError ? (
          <View className="py-10">
            <Text className="mb-2 text-2xl text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              This report is unavailable
            </Text>
            <Text className="text-neutral-600">
              The link may have expired, or you do not have access. Start a new price check from the Price Checker.
            </Text>
          </View>
        ) : null}

        {report ? (
          <>
            <Text className="mb-1 text-xs uppercase tracking-wide text-neutral-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              BuildMyHouse Price Report
            </Text>
            <Text className="mb-2 text-3xl text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {report.product.name}
            </Text>
            <Text className="mb-6 text-sm text-neutral-500">
              Generated {new Date(report.generatedAt).toLocaleString('en-NG')} · Ref {report.reportId.slice(0, 8)}
              {report.reportVersion > 1 ? ` · Version ${report.reportVersion}` : ''}
            </Text>

            {report.updateNotice ? (
              <View className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                <Text className="text-sm text-amber-950" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  This report was updated after an evidence review
                </Text>
                <Text className="mt-1 text-sm text-amber-900">{report.updateNotice}</Text>
                {report.updatedAt ? (
                  <Text className="mt-1 text-xs text-amber-800">
                    Updated {new Date(report.updatedAt).toLocaleString('en-NG')}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <Section title="Location">
              <Text className="text-neutral-800">{report.location.requested}</Text>
              {report.location.limitations.map((l) => (
                <Text key={l} className="mt-1 text-sm text-amber-800">
                  Note: {l}
                </Text>
              ))}
            </Section>

            {report.status === 'insufficient_data' ? (
              <Section title="Result">
                <Text className="mb-2 text-lg text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Insufficient reliable data
                </Text>
                <Text className="text-neutral-700">{report.insufficientData?.explanation}</Text>
              </Section>
            ) : report.status === 'single_source' ? (
              <Section title="Single-source observed price">
                <Text className="text-2xl text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {money(report.pricing.currency, report.pricing.singleSourcePrice)}
                  {report.pricing.normalisedUnit ? ` per ${report.pricing.normalisedUnit}` : ''}
                </Text>
                <Text className="mt-2 text-sm text-amber-800">
                  This is one observed price from a single independent source. It is not a market range.
                </Text>
              </Section>
            ) : (
              <>
                <Section title="Latest observed range">
                  <Text className="text-2xl text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {money(report.pricing.currency, report.pricing.observedLow)} –{' '}
                    {money(report.pricing.currency, report.pricing.observedHigh)}
                    {report.pricing.normalisedUnit ? ` per ${report.pricing.normalisedUnit}` : ''}
                  </Text>
                </Section>
                <Section title="Typical observed price">
                  <Text className="text-xl text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {money(report.pricing.currency, report.pricing.typicalPrice)}
                    {report.pricing.normalisedUnit ? ` per ${report.pricing.normalisedUnit}` : ''}
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-500">Median of accepted observations</Text>
                </Section>
              </>
            )}

            <Section title="What the price appears to include">
              {[...report.inclusions, ...report.exclusions, ...report.unknowns].map((item) => (
                <Text key={item} className="mb-1 text-neutral-700">
                  • {item}
                </Text>
              ))}
            </Section>

            <Section title="Sources checked">
              {report.sources.length === 0 ? (
                <Text className="text-neutral-600">No accepted sources after validation.</Text>
              ) : (
                report.sources.map((s, i) => (
                  <View key={`${s.sourceUrl}-${i}`} className="mb-4 border-b border-neutral-100 pb-3">
                    <Text className="text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {s.sellerName ?? 'Unnamed seller'} · {s.sourceTierLabel}
                    </Text>
                    <Text className="text-neutral-800">
                      {money(s.currency, s.displayedPrice)}
                      {s.originalUnit ? ` per ${s.originalUnit}` : ''}
                      {s.normalizedPrice !== null && s.normalizedUnit
                        ? ` (≈ ${money(s.currency, s.normalizedPrice)} per ${s.normalizedUnit})`
                        : ''}
                    </Text>
                    <Text className="text-sm text-neutral-500">
                      Checked {s.dateChecked.slice(0, 10)}
                      {s.listingDate ? ` · Listed ${s.listingDate.slice(0, 10)}` : ''}
                    </Text>
                    <Text className="text-xs text-neutral-400" numberOfLines={1}>
                      {s.sourceUrl}
                    </Text>
                  </View>
                ))
              )}
            </Section>

            <Section title="Confidence">
              <View
                className="mb-3 self-start rounded-full px-3 py-1"
                style={{ backgroundColor: tone?.bg, borderWidth: 1, borderColor: tone?.border }}
              >
                <Text style={{ color: tone?.fg, fontFamily: 'Poppins_600SemiBold' }}>
                  {report.confidence.label.replace('_', ' ')} · {report.confidence.score}/100
                </Text>
              </View>
              {report.confidence.positiveReasons.map((r) => (
                <Text key={r} className="mb-1 text-sm text-neutral-700">
                  + {r}
                </Text>
              ))}
              {report.confidence.limitingReasons.map((r) => (
                <Text key={r} className="mb-1 text-sm text-neutral-600">
                  − {r}
                </Text>
              ))}
            </Section>

            <Section title="Important caution">
              {report.cautions.map((c) => (
                <Text key={c} className="mb-2 text-sm text-neutral-700">
                  • {c}
                </Text>
              ))}
            </Section>

            <Section title="BuildMyHouse next step">
              {report.status === 'insufficient_data' ? (
                <Pressable
                  onPress={async () => {
                    priceCheckerAnalytics.manualCheckRequested('report_page');
                    const url = buildManualMarketCheckWhatsAppUrl({
                      productName: report.product.name,
                      brand: report.product.brand,
                      specification: report.product.specification,
                      unit: report.product.requestedUnit,
                      location: report.location.requested,
                      reportRef: report.reportId.slice(0, 8),
                    });
                    if (Platform.OS === 'web') window.open(url, '_blank', 'noopener,noreferrer');
                    else await Linking.openURL(url);
                  }}
                  className="min-h-[48px] flex-row items-center justify-center rounded-2xl px-4"
                  style={{ backgroundColor: pc.green }}
                  accessibilityRole="link"
                  accessibilityLabel="Request a verified local market check on WhatsApp"
                >
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {report.buildMyHouseNextStep.label} · WhatsApp
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-neutral-800">{report.buildMyHouseNextStep.label}</Text>
              )}
            </Section>

            <View className="mt-4 gap-3">
              <Pressable
                onPress={downloadPdf}
                disabled={pdfBusy}
                className="min-h-[48px] items-center justify-center rounded-2xl"
                style={{ backgroundColor: pc.green, opacity: pdfBusy ? 0.75 : 1 }}
                accessibilityRole="button"
                accessibilityLabel="Download PDF"
              >
                <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {pdfBusy ? 'Preparing PDF…' : 'Download PDF'}
                </Text>
              </Pressable>
              {pdfError ? (
                <Text className="text-center text-sm text-red-700">{pdfError}</Text>
              ) : null}
              {!isSaved ? (
                <Pressable
                  onPress={saveReport}
                  disabled={saving}
                  className="min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200"
                  accessibilityRole="button"
                >
                  <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {saving ? 'Saving…' : user ? 'Save to account' : 'Sign in to save this report'}
                  </Text>
                </Pressable>
              ) : (
                <View className="items-center gap-1 py-2">
                  <Text className="text-center text-sm text-emerald-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Saved to your account
                  </Text>
                  <Text className="text-center text-xs text-neutral-500">
                    Keep this page link to reopen the online report anytime.
                  </Text>
                </View>
              )}
              <Pressable
                onPress={() => router.push('/tools/price-checker' as any)}
                className="min-h-[44px] items-center justify-center"
              >
                <Text className="text-neutral-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Start another price check
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <Text className="mb-2 text-xs uppercase tracking-wide text-neutral-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

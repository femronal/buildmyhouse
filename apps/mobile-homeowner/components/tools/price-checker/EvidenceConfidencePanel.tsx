import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { RESEARCH_STAGES, ResearchStatusDto, ConsumerConfidenceDto } from '@/lib/price-checker/types';
import { EvidenceMetric } from './EvidenceMetric';
import { confidenceTone, pc } from './theme';

type Props = {
  phase: string;
  research: ResearchStatusDto | null;
  confidence: ConsumerConfidenceDto | null;
  lastUpdated: string | null;
};

export function EvidenceConfidencePanel({ phase, research, confidence, lastUpdated }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const beforeResearch = !research && phase !== 'processing' && phase !== 'report_ready' && phase !== 'insufficient_data';
  const stageLabel = research?.stage
    ? RESEARCH_STAGES.find((s) => s.code === research.stage)?.label ?? research.stage
    : null;

  return (
    <View
      className="rounded-[2rem] border p-6 md:p-8"
      style={{ backgroundColor: pc.charcoalSoft, borderColor: pc.panelBorder }}
      accessibilityLabel="Evidence and confidence"
    >
      <Text className="mb-4 text-xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
        Evidence and confidence
      </Text>

      {beforeResearch ? (
        <Text className="text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
          Your confidence score will appear after BuildMyHouse compares recent, specification-matched and
          location-relevant prices.
        </Text>
      ) : (
        <>
          <View
            className="mb-4 rounded-2xl border border-white/5 p-5"
            style={{ backgroundColor: pc.charcoalDeep }}
          >
            {confidence ? (
              <View className="mb-4 flex-row items-end justify-between">
                <View>
                  <Text className="text-xs uppercase tracking-wide text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Confidence
                  </Text>
                  <Text className="text-3xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {confidence.score} / 100
                  </Text>
                  <View
                    className="mt-2 self-start rounded-full px-3 py-1"
                    style={{
                      backgroundColor: confidenceTone(confidence.label).bg,
                      borderWidth: 1,
                      borderColor: confidenceTone(confidence.label).border,
                    }}
                  >
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', color: confidenceTone(confidence.label).fg, fontSize: 12 }}>
                      {confidence.label === 'insufficient_data' ? 'Insufficient data' : `${confidence.label} confidence`}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setDrawerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Why this score?"
                  className="min-h-[44px] justify-center"
                >
                  <Text className="text-sm underline" style={{ fontFamily: 'Poppins_500Medium', color: '#6ee7b7' }}>
                    Why this score?
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text className="mb-4 text-sm text-slate-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                Confidence: Calculating
              </Text>
            )}

            <View className="flex-row flex-wrap gap-6">
              <EvidenceMetric label="Sources checked" value={research?.metrics.discoveredSourceCount ?? null} />
              <EvidenceMetric label="Independent sellers" value={research?.metrics.independentSourceCount ?? null} />
              <EvidenceMetric label="Accepted prices" value={research?.metrics.acceptedObservationCount ?? null} />
            </View>

            {stageLabel ? (
              <Text className="mt-4 text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                Current stage: {stageLabel}
              </Text>
            ) : null}
            {lastUpdated ? (
              <Text className="mt-1 text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                Last updated {lastUpdated}
              </Text>
            ) : null}
          </View>
        </>
      )}

      <Modal visible={drawerOpen} animationType="slide" transparent onRequestClose={() => setDrawerOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setDrawerOpen(false)}>
          <Pressable
            className="max-h-[80%] rounded-t-3xl bg-white px-5 pb-10 pt-4"
            onPress={(e) => e.stopPropagation?.()}
          >
            <View className="mb-4 h-1 w-12 self-center rounded-full bg-neutral-200" />
            <Text className="mb-3 text-xl text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Why this score?
            </Text>
            <ScrollView>
              {confidence ? (
                <>
                  {(
                    [
                      ['Source quality', confidence.components.sourceQuality],
                      ['Recency', confidence.components.recency],
                      ['Specification match', confidence.components.specificationMatch],
                      ['Location match', confidence.components.locationMatch],
                      ['Price clustering', confidence.components.priceClustering],
                    ] as const
                  ).map(([label, component]) => (
                    <View key={label} className="mb-3 flex-row justify-between border-b border-neutral-100 pb-3">
                      <Text className="text-sm text-neutral-700" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {label}
                      </Text>
                      <Text className="text-sm text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {component.score} / {component.max}
                      </Text>
                    </View>
                  ))}
                  {confidence.positiveReasons.map((r) => (
                    <Text key={r} className="mb-2 text-sm text-neutral-700" style={{ fontFamily: 'Poppins_400Regular' }}>
                      + {r}
                    </Text>
                  ))}
                  {confidence.limitingReasons.map((r) => (
                    <Text key={r} className="mb-2 text-sm text-neutral-600" style={{ fontFamily: 'Poppins_400Regular' }}>
                      − {r}
                    </Text>
                  ))}
                  {confidence.limitations.map((r) => (
                    <Text key={r} className="mb-2 text-sm text-amber-800" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Note: {r}
                    </Text>
                  ))}
                </>
              ) : (
                <Text className="text-sm text-neutral-600">Confidence details will appear when the report is ready.</Text>
              )}
            </ScrollView>
            <Pressable
              onPress={() => setDrawerOpen(false)}
              className="mt-4 min-h-[44px] items-center justify-center rounded-xl bg-black"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Close
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

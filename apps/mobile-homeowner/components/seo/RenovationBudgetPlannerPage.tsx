import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, CheckCircle2, Hammer, Home, Paintbrush2, Wrench } from 'lucide-react-native';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { cardShadowStyle } from '@/lib/card-styles';
import { renovationBudgetPlannerPageContent as content } from '@/lib/renovation-budget-planner-content';
import { useWebSeo } from '@/lib/seo';

type PropertyType = (typeof content.planner.fields)[0]['options'][number];
type Location = (typeof content.planner.fields)[1]['options'][number];
type SizeBand = (typeof content.planner.fields)[2]['options'][number];
type FinishLevel = (typeof content.planner.fields)[3]['options'][number];
type SpaceName = (typeof content.planner.spaces.options)[number];
type WorkType = (typeof content.planner.workTypePerSpace.options)[number];

type SpaceEstimate = {
  space: SpaceName;
  workType: WorkType;
  estimate: number;
};

const PLANNER_STORAGE_KEY = 'bmh_renovation_budget_planner_v1';

const BASE_SPACE_COST_NGN: Record<SpaceName, number> = {
  'Living room': 2200000,
  Kitchen: 5500000,
  Bathrooms: 3800000,
  Bedrooms: 2000000,
  'Roofing/Ceiling': 4800000,
  Electrical: 3600000,
  Plumbing: 3400000,
  'Windows/Doors': 2600000,
  Exterior: 3000000,
  'Compound/Landscaping': 2400000,
};

const LOCATION_MULTIPLIER: Record<Location, number> = {
  Lagos: 1.18,
  Abuja: 1.12,
  'Other Nigeria': 1,
};

const SIZE_MULTIPLIER: Record<SizeBand, number> = {
  Small: 0.85,
  Medium: 1,
  Large: 1.3,
};

const FINISH_MULTIPLIER: Record<FinishLevel, number> = {
  Basic: 0.85,
  'Mid-range': 1,
  Premium: 1.35,
};

const WORK_TYPE_MULTIPLIER: Record<WorkType, number> = {
  Repairs: 0.65,
  Upgrade: 1,
  'Full redo': 1.45,
};

function resolveInternalHref(href: string) {
  if (href.startsWith('/projects/new')) return '/location?mode=explore';
  return href;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function spaceIcon(space: SpaceName) {
  const normalized = space.toLowerCase();
  if (normalized.includes('kitchen') || normalized.includes('bathroom')) return Home;
  if (normalized.includes('roof') || normalized.includes('electrical') || normalized.includes('plumbing')) {
    return Wrench;
  }
  if (normalized.includes('exterior') || normalized.includes('compound')) return Hammer;
  return Paintbrush2;
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="text-gray-700 text-xs mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
        {label}
      </Text>
      <View className="flex-row flex-wrap">
        {options.map((option) => {
          const selected = option === value;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onChange(option)}
              className={`rounded-full px-3 py-1.5 mr-2 mb-2 border ${
                selected ? 'bg-black border-black' : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={`text-xs ${selected ? 'text-white' : 'text-gray-700'}`}
                style={{ fontFamily: selected ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function RenovationBudgetPlannerPage() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [plannerY, setPlannerY] = useState(0);

  const [propertyType, setPropertyType] = useState<PropertyType>(content.planner.fields[0].options[0]);
  const [location, setLocation] = useState<Location>(content.planner.fields[1].options[0]);
  const [sizeBand, setSizeBand] = useState<SizeBand>(content.planner.fields[2].options[1]);
  const [finishLevel, setFinishLevel] = useState<FinishLevel>(content.planner.fields[3].options[1]);
  const [contingencyPercentage, setContingencyPercentage] = useState('');
  const [selectedSpaces, setSelectedSpaces] = useState<SpaceName[]>([]);
  const [spaceWorkTypes, setSpaceWorkTypes] = useState<Record<SpaceName, WorkType>>({} as Record<SpaceName, WorkType>);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);

  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');
  const normalizedRobots = content.seo.robots.replace(/\s+/g, '') as 'index,follow' | 'noindex,nofollow';

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots: normalizedRobots,
    jsonLd: content.faqSchema,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setHasHydratedDraft(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
      if (!raw) {
        setHasHydratedDraft(true);
        return;
      }

      const parsed = JSON.parse(raw) as {
        propertyType?: PropertyType;
        location?: Location;
        sizeBand?: SizeBand;
        finishLevel?: FinishLevel;
        contingencyPercentage?: string;
        selectedSpaces?: SpaceName[];
        spaceWorkTypes?: Partial<Record<SpaceName, WorkType>>;
      };

      if (parsed.propertyType) setPropertyType(parsed.propertyType);
      if (parsed.location) setLocation(parsed.location);
      if (parsed.sizeBand) setSizeBand(parsed.sizeBand);
      if (parsed.finishLevel) setFinishLevel(parsed.finishLevel);
      if (parsed.contingencyPercentage !== undefined) setContingencyPercentage(parsed.contingencyPercentage);
      if (Array.isArray(parsed.selectedSpaces)) setSelectedSpaces(parsed.selectedSpaces);
      if (parsed.spaceWorkTypes) {
        setSpaceWorkTypes(parsed.spaceWorkTypes as Record<SpaceName, WorkType>);
      }
    } catch {
      // ignore malformed draft
    } finally {
      setHasHydratedDraft(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedDraft || Platform.OS !== 'web') return;

    const draft = {
      propertyType,
      location,
      sizeBand,
      finishLevel,
      contingencyPercentage,
      selectedSpaces,
      spaceWorkTypes,
    };
    window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(draft));
  }, [
    contingencyPercentage,
    finishLevel,
    hasHydratedDraft,
    location,
    propertyType,
    selectedSpaces,
    sizeBand,
    spaceWorkTypes,
  ]);

  const contingencyPercentValue = Math.max(0, Math.min(100, toNumber(contingencyPercentage)));

  const spaceEstimates = useMemo(() => {
    return selectedSpaces.map((space): SpaceEstimate => {
      const workType = spaceWorkTypes[space] || 'Upgrade';
      const estimate =
        BASE_SPACE_COST_NGN[space] *
        LOCATION_MULTIPLIER[location] *
        SIZE_MULTIPLIER[sizeBand] *
        FINISH_MULTIPLIER[finishLevel] *
        WORK_TYPE_MULTIPLIER[workType];

      return {
        space,
        workType,
        estimate,
      };
    });
  }, [finishLevel, location, selectedSpaces, sizeBand, spaceWorkTypes]);

  const subtotal = spaceEstimates.reduce((sum, row) => sum + row.estimate, 0);
  const contingencyAmount = subtotal * (contingencyPercentValue / 100);
  const totalEstimate = subtotal + contingencyAmount;
  const showResults = selectedSpaces.length > 0 && contingencyPercentage.trim().length > 0;

  const highCostAreas = useMemo(() => {
    const guidanceSet = new Set(
      content.suggestedGuidance.items.map((item) =>
        item
          .toLowerCase()
          .replace(/\s+and\s+/g, '/')
          .replace(/\s+/g, ''),
      ),
    );

    const matched = spaceEstimates.filter((row) => {
      const normalizedSpace = row.space.toLowerCase().replace(/\s+/g, '');
      const inGuidance = Array.from(guidanceSet).some((item) => {
        const short = item.replace(/[^a-z/]/g, '');
        return normalizedSpace.includes(short.split('/')[0] || short);
      });
      const expensiveByShare = subtotal > 0 ? row.estimate / subtotal >= 0.2 : false;
      return inGuidance || expensiveByShare;
    });

    if (matched.length > 0) return matched;
    return [...spaceEstimates].sort((a, b) => b.estimate - a.estimate).slice(0, 2);
  }, [spaceEstimates, subtotal]);

  const toggleSpaceSelection = (space: SpaceName) => {
    setSelectedSpaces((previous) => {
      if (previous.includes(space)) {
        const next = previous.filter((item) => item !== space);
        setSpaceWorkTypes((workTypes) => {
          const copy = { ...workTypes };
          delete copy[space];
          return copy as Record<SpaceName, WorkType>;
        });
        return next;
      }

      setSpaceWorkTypes((workTypes) => ({
        ...workTypes,
        [space]: workTypes[space] || 'Upgrade',
      }));
      return [...previous, space];
    });
  };

  const updateWorkType = (space: SpaceName, workType: WorkType) => {
    setSpaceWorkTypes((previous) => ({ ...previous, [space]: workType }));
  };

  const resetPlanner = () => {
    setPropertyType(content.planner.fields[0].options[0]);
    setLocation(content.planner.fields[1].options[0]);
    setSizeBand(content.planner.fields[2].options[1]);
    setFinishLevel(content.planner.fields[3].options[1]);
    setContingencyPercentage('');
    setSelectedSpaces([]);
    setSpaceWorkTypes({} as Record<SpaceName, WorkType>);
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(PLANNER_STORAGE_KEY);
    }
  };

  const openLink = (href: string) => {
    if (href.startsWith('#')) {
      if (scrollRef.current) scrollRef.current.scrollTo({ y: plannerY, animated: true });
      return;
    }
    if (href.startsWith('http://') || href.startsWith('https://')) {
      Linking.openURL(href);
      return;
    }
    router.push(resolveInternalHref(href) as any);
  };

  const exportEstimateAsPdf = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      Alert.alert('Export unavailable', 'PDF export is currently available on web.');
      return;
    }

    if (!showResults) {
      Alert.alert('No estimate yet', 'Please choose your spaces and work type first.');
      return;
    }

    const tableRows = spaceEstimates
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.space)}</td>
            <td>${escapeHtml(row.workType)}</td>
            <td>${escapeHtml(formatNaira(row.estimate))}</td>
          </tr>
        `,
      )
      .join('');

    const highCostRows = highCostAreas
      .map((row) => `<p>- ${escapeHtml(row.space)} (${escapeHtml(row.workType)}): ${escapeHtml(formatNaira(row.estimate))}</p>`)
      .join('');

    const html = `
      <html>
        <head>
          <title>BuildMyHouse Renovation Budget Estimate</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1, h2 { margin: 0 0 10px 0; }
            p { margin: 0 0 8px 0; line-height: 1.5; }
            .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 14px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>BuildMyHouse - Renovation Budget Estimate</h1>
          <p>This is a rough planning guide, not a final contractor quote.</p>
          <div class="card">
            <h2>${escapeHtml(content.summaryBox.title)}</h2>
            <p>Property: ${escapeHtml(propertyType)} in ${escapeHtml(location)}</p>
            <p>Size: ${escapeHtml(sizeBand)} | Finish level: ${escapeHtml(finishLevel)}</p>
            <p>Estimated subtotal: ${escapeHtml(formatNaira(subtotal))}</p>
            <p>Contingency amount (${escapeHtml(String(contingencyPercentValue))}%): ${escapeHtml(formatNaira(contingencyAmount))}</p>
            <p><strong>Total estimated renovation budget: ${escapeHtml(formatNaira(totalEstimate))}</strong></p>
          </div>
          <div class="card">
            <h2>Estimated cost per space</h2>
            <table>
              <thead>
                <tr>
                  <th>Space</th>
                  <th>Work type</th>
                  <th>Estimate</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
          <div class="card">
            <h2>Likely high-cost areas</h2>
            ${highCostRows}
          </div>
          <div class="card">
            <h2>${escapeHtml(content.smartWarnings.title)}</h2>
            ${content.smartWarnings.items.map((item) => `<p>- ${escapeHtml(item)}</p>`).join('')}
          </div>
        </body>
      </html>
    `;

    const popup = window.open('', '_blank');
    if (!popup) {
      Alert.alert('Popup blocked', 'Please allow popups to export your estimate as PDF.');
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 300);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView ref={scrollRef} className="flex-1 px-5 md:px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-10 pb-4 md:pt-14">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/login'))}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mb-4"
          >
            <ArrowLeft size={18} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>

          <Text className="text-[11px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.hero.eyebrow}
          </Text>
          <SeoHeading level={1} className="text-black text-3xl leading-tight mb-3 md:text-4xl" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hero.title}
          </SeoHeading>
          <Text className="text-gray-700 text-base leading-7 mb-4 md:text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>

          <View className="w-full rounded-2xl overflow-hidden border border-gray-200 mb-4" style={{ height: 210 }}>
            <Image
              source={{ uri: content.coverImage.src }}
              accessibilityLabel={content.coverImage.alt}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity onPress={() => openLink(content.hero.primaryCta.href)} className="rounded-full bg-black px-5 py-3">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.hero.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink(content.hero.secondaryCta.href)} className="rounded-full border border-gray-300 px-5 py-3">
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.hero.secondaryCta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {content.intro.paragraphs.map((paragraph) => (
          <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            {paragraph}
          </Text>
        ))}

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatThisToolDoes.title}
          </SeoHeading>
          {content.whatThisToolDoes.items.map((item) => (
            <View key={item} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#4b5563" strokeWidth={2.1} style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-4 mb-5">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.simpleExplanation.title}
          </SeoHeading>
          {content.simpleExplanation.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View
          nativeID={content.planner.id}
          onLayout={(event) => setPlannerY(event.nativeEvent.layout.y)}
          style={cardShadowStyle}
          className="bg-white border border-gray-200 rounded-2xl p-4 mb-6"
        >
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.planner.title}
          </SeoHeading>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
              Your progress is saved on this device.
            </Text>
            <TouchableOpacity onPress={resetPlanner} className="border border-gray-300 rounded-full px-3 py-1">
              <Text className="text-xs text-gray-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Reset planner
              </Text>
            </TouchableOpacity>
          </View>

          <SelectField label={content.planner.fields[0].label} value={propertyType} options={content.planner.fields[0].options} onChange={setPropertyType} />
          <SelectField label={content.planner.fields[1].label} value={location} options={content.planner.fields[1].options} onChange={setLocation} />
          <SelectField label={content.planner.fields[2].label} value={sizeBand} options={content.planner.fields[2].options} onChange={setSizeBand} />
          <SelectField label={content.planner.fields[3].label} value={finishLevel} options={content.planner.fields[3].options} onChange={setFinishLevel} />

          <View className="mb-3">
            <Text className="text-gray-700 text-xs mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
              {content.planner.fields[4].label}
            </Text>
            <TextInput
              keyboardType="numeric"
              value={contingencyPercentage}
              onChangeText={setContingencyPercentage}
              placeholder={content.planner.fields[4].placeholder}
              className="rounded-xl border border-gray-300 px-3 py-3 text-sm text-black bg-white"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              {content.planner.fields[4].helpText}
            </Text>
          </View>
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.planner.spaces.title}
          </SeoHeading>
          <View className="flex-row flex-wrap">
            {content.planner.spaces.options.map((space) => {
              const selected = selectedSpaces.includes(space);
              return (
                <TouchableOpacity
                  key={space}
                  onPress={() => toggleSpaceSelection(space)}
                  className={`rounded-full px-3 py-1.5 mr-2 mb-2 border ${
                    selected ? 'bg-black border-black' : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-xs ${selected ? 'text-white' : 'text-gray-700'}`}
                    style={{ fontFamily: selected ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
                  >
                    {space}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedSpaces.length > 0 ? (
          <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
            <SeoHeading level={2} className="text-black text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.planner.workTypePerSpace.title}
            </SeoHeading>
            <Text className="text-xs text-gray-500 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {content.planner.workTypePerSpace.helpText}
            </Text>
            {selectedSpaces.map((space) => (
              <View key={space} className="border border-gray-200 rounded-xl p-3 mb-3 bg-gray-50">
                <Text className="text-gray-900 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {space}
                </Text>
                <SelectField
                  label="Choose work type"
                  value={spaceWorkTypes[space] || 'Upgrade'}
                  options={content.planner.workTypePerSpace.options}
                  onChange={(next) => updateWorkType(space, next)}
                />
              </View>
            ))}
          </View>
        ) : null}

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.resultSection.title}
          </SeoHeading>
          <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.resultSection.description}
          </Text>
          <Text className="text-xs text-gray-500 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            This is a rough planning guide, not a final contractor quote.
          </Text>

          {!showResults ? (
            <View className="bg-gray-100 border border-gray-300 rounded-xl p-4">
              <Text className="text-gray-700 text-sm leading-7" style={{ fontFamily: 'Poppins_500Medium' }}>
                {content.summaryBox.emptyState}
              </Text>
            </View>
          ) : (
            <>
              <View className="bg-gray-50 border border-gray-300 rounded-xl p-4 mb-3">
                <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {content.summaryBox.title}
                </SeoHeading>
                <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Property: {propertyType} in {location}
                </Text>
                <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Size: {sizeBand} | Finish level: {finishLevel}
                </Text>
                <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Estimated subtotal: {formatNaira(subtotal)}
                </Text>
                <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Contingency amount ({contingencyPercentValue}%): {formatNaira(contingencyAmount)}
                </Text>
                <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Total estimated renovation budget: {formatNaira(totalEstimate)}
                </Text>
              </View>

              <View className="border border-gray-300 rounded-xl overflow-hidden mb-3">
                <View className="flex-row bg-gray-100 border-b border-gray-300 px-3 py-2">
                  <Text className="flex-1 text-xs text-gray-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Space
                  </Text>
                  <Text className="w-24 text-xs text-gray-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Work type
                  </Text>
                  <Text className="w-32 text-xs text-gray-700 text-right" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Estimate
                  </Text>
                </View>
                {spaceEstimates.map((row) => (
                  <View key={row.space} className="flex-row px-3 py-2 border-b border-gray-200 last:border-b-0 bg-white">
                    <Text className="flex-1 text-xs text-gray-800" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {row.space}
                    </Text>
                    <Text className="w-24 text-xs text-gray-700" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {row.workType}
                    </Text>
                    <Text className="w-32 text-xs text-gray-800 text-right" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {formatNaira(row.estimate)}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="bg-black rounded-xl p-3">
                <View className="flex-row items-center mb-1">
                  <AlertTriangle size={15} color="#ffffff" />
                  <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Likely high-cost areas
                  </Text>
                </View>
                {highCostAreas.map((row) => (
                  <Text key={row.space} className="text-white/90 text-xs leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
                    • {row.space} ({row.workType}) - around {formatNaira(row.estimate)}
                  </Text>
                ))}
              </View>

              <TouchableOpacity onPress={exportEstimateAsPdf} className="rounded-full border border-gray-300 px-4 py-2.5 mt-3 self-start">
                <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Export estimate as PDF (save/share)
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-white text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.smartWarnings.title}
          </SeoHeading>
          {content.smartWarnings.items.map((item) => (
            <Text key={item} className="text-white/90 text-sm leading-6 mb-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.suggestedGuidance.title}
          </SeoHeading>
          {content.suggestedGuidance.items.map((item) => (
            <View key={item} className="flex-row items-start mb-2">
              <Hammer size={16} color="#4b5563" style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whyItMatters.title}
          </SeoHeading>
          {content.whyItMatters.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.buildMyHouseFit.title}
          </SeoHeading>
          {content.buildMyHouseFit.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <InternalLinksBlock title={content.relatedResources.title} links={[...content.relatedResources.links]} />

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.cta.title}
          </SeoHeading>
          <Text className="text-gray-700 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.cta.description}
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity onPress={() => openLink(content.cta.primary.href)} className="rounded-full bg-black px-5 py-3">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.cta.primary.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink(content.cta.secondary.href)} className="rounded-full border border-gray-300 px-5 py-3">
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.cta.secondary.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <CollapsibleFaqSection title={content.faq.title} items={content.faq.items} />
      </ScrollView>
    </View>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { cardShadowStyle } from '@/lib/card-styles';
import { milestonePaymentScheduleBuilderPageContent as content } from '@/lib/milestone-payment-schedule-builder-content';
import { useWebSeo } from '@/lib/seo';

type ProjectType = (typeof content.builder.fields)[0]['options'][number];
type PaymentMode = (typeof content.builder.fields)[4]['options'][number];
type Currency = (typeof content.builder.fields)[2]['options'][number];

type StageRow = {
  stageName: string;
  stageValue: string;
  proofRequired: string[];
  notes: string;
};

type SummaryRow = {
  stageName: string;
  stagePayment: number;
  proofRequired: string[];
  notes: string;
  runningTotalPaid: number;
  amountRemaining: number;
};

function resolveInternalHref(href: string) {
  if (href.startsWith('/projects/new')) return '/location?mode=explore';
  return href;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number, currency: Currency) {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
  }
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

export default function MilestonePaymentScheduleBuilderPage() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [builderY, setBuilderY] = useState(0);

  const [projectType, setProjectType] = useState<ProjectType>('New build');
  const [totalBudget, setTotalBudget] = useState('');
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [stageCount, setStageCount] = useState('4');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Percentage by stage');
  const [contingencyPercentage, setContingencyPercentage] = useState('10');
  const [stages, setStages] = useState<StageRow[]>([]);

  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');
  const normalizedRobots = content.seo.robots.replace(/\s+/g, '') as 'index,follow' | 'noindex,nofollow';

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots: normalizedRobots,
    jsonLd: content.faqSchema,
  });

  const stageCountNumber = Math.max(1, Number(stageCount) || 1);
  const defaultStageNames = content.suggestedDefaults.byProjectType[projectType];

  useEffect(() => {
    setStages((previous) => {
      const next: StageRow[] = [];
      for (let index = 0; index < stageCountNumber; index += 1) {
        const existing = previous[index];
        const suggestedName = defaultStageNames[index] || `Stage ${index + 1}`;
        next.push(
          existing || {
            stageName: suggestedName,
            stageValue: '',
            proofRequired: [],
            notes: '',
          },
        );
      }
      return next;
    });
  }, [defaultStageNames, stageCountNumber]);

  const contingencyPercentValue = Math.max(0, Math.min(100, toNumber(contingencyPercentage)));
  const totalBudgetValue = Math.max(0, toNumber(totalBudget));
  const contingencyAmount = (totalBudgetValue * contingencyPercentValue) / 100;
  const usableBudget = Math.max(0, totalBudgetValue - contingencyAmount);

  const summaryRows = useMemo(() => {
    let runningTotal = 0;
    return stages.map((stage): SummaryRow => {
      const rawValue = Math.max(0, toNumber(stage.stageValue));
      const stagePayment =
        paymentMode === 'Percentage by stage' ? (usableBudget * rawValue) / 100 : rawValue;
      runningTotal += stagePayment;
      return {
        stageName: stage.stageName || 'Untitled stage',
        stagePayment,
        proofRequired: stage.proofRequired,
        notes: stage.notes,
        runningTotalPaid: runningTotal,
        amountRemaining: usableBudget - runningTotal,
      };
    });
  }, [paymentMode, stages, usableBudget]);

  const totalAllocatedAmount = summaryRows.reduce((sum, row) => sum + row.stagePayment, 0);
  const totalStageValueRaw = stages.reduce((sum, stage) => sum + Math.max(0, toNumber(stage.stageValue)), 0);

  const dynamicWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (totalBudgetValue <= 0) warnings.push('Enter a valid total project budget greater than zero.');
    if (paymentMode === 'Percentage by stage' && Math.abs(totalStageValueRaw - 100) > 0.01) {
      warnings.push(`Stage percentages currently add up to ${totalStageValueRaw.toFixed(2)}%, not 100%.`);
    }
    if (paymentMode === 'Amount by stage' && totalAllocatedAmount > usableBudget) {
      warnings.push('Your stage allocations are above the usable budget after contingency.');
    }
    if (paymentMode === 'Amount by stage' && totalAllocatedAmount < usableBudget) {
      warnings.push('Your stage allocations are below the usable budget. Some budget is still unallocated.');
    }
    if (contingencyPercentValue > 30) {
      warnings.push('Contingency above 30% may signal unclear scope. Review your stage definitions.');
    }
    return warnings;
  }, [contingencyPercentValue, paymentMode, totalAllocatedAmount, totalBudgetValue, totalStageValueRaw, usableBudget]);

  const openLink = (href: string) => {
    if (href.startsWith('#')) {
      if (scrollRef.current) scrollRef.current.scrollTo({ y: builderY, animated: true });
      return;
    }
    if (href.startsWith('http://') || href.startsWith('https://')) {
      Linking.openURL(href);
      return;
    }
    router.push(resolveInternalHref(href) as any);
  };

  const updateStage = (index: number, next: Partial<StageRow>) => {
    setStages((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, ...next } : row)));
  };

  const toggleProof = (stageIndex: number, proof: string) => {
    const stage = stages[stageIndex];
    if (!stage) return;
    const set = new Set(stage.proofRequired);
    if (set.has(proof)) set.delete(proof);
    else set.add(proof);
    updateStage(stageIndex, { proofRequired: Array.from(set) });
  };

  const budgetPlaceholder = content.builder.fields.find((field) => field.name === 'totalBudget')?.placeholder ?? 'Enter total budget';
  const contingencyHelpText = content.builder.fields.find((field) => field.name === 'contingencyPercentage')?.helpText ?? '';

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
          nativeID={content.builder.id}
          onLayout={(event) => setBuilderY(event.nativeEvent.layout.y)}
          style={cardShadowStyle}
          className="bg-white border border-gray-200 rounded-2xl p-4 mb-6"
        >
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.builder.title}
          </SeoHeading>

          <SelectField label={content.builder.fields[0].label} value={projectType} options={content.builder.fields[0].options} onChange={setProjectType} />

          <View className="mb-3">
            <Text className="text-gray-700 text-xs mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
              {content.builder.fields[1].label}
            </Text>
            <TextInput
              keyboardType="numeric"
              value={totalBudget}
              onChangeText={setTotalBudget}
              placeholder={budgetPlaceholder}
              className="rounded-xl border border-gray-300 px-3 py-3 text-sm text-black bg-white"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
          </View>

          <SelectField label={content.builder.fields[2].label} value={currency} options={content.builder.fields[2].options} onChange={setCurrency} />
          <SelectField label={content.builder.fields[3].label} value={stageCount} options={content.builder.fields[3].options} onChange={setStageCount} />
          <SelectField label={content.builder.fields[4].label} value={paymentMode} options={content.builder.fields[4].options} onChange={setPaymentMode} />

          <View className="mb-1">
            <Text className="text-gray-700 text-xs mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
              {content.builder.fields[5].label}
            </Text>
            <TextInput
              keyboardType="numeric"
              value={contingencyPercentage}
              onChangeText={setContingencyPercentage}
              placeholder={content.builder.fields[5].placeholder}
              className="rounded-xl border border-gray-300 px-3 py-3 text-sm text-black bg-white"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              {contingencyHelpText}
            </Text>
          </View>
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.builder.stageFields.title}
          </SeoHeading>
          <Text className="text-xs text-gray-500 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            Suggested defaults are prefilled based on selected project type. Adjust any stage to fit your scope.
          </Text>

          {stages.map((stage, index) => (
            <View key={`stage-${index + 1}`} className="border border-gray-200 rounded-xl p-3 mb-3 bg-gray-50">
              <Text className="text-xs uppercase text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Stage {index + 1}
              </Text>

              <Text className="text-gray-700 text-xs mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
                {content.builder.stageFields.fields[0].label}
              </Text>
              <TextInput
                value={stage.stageName}
                onChangeText={(text) => updateStage(index, { stageName: text })}
                placeholder={content.builder.stageFields.fields[0].placeholder}
                className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-black bg-white mb-2.5"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              <Text className="text-gray-700 text-xs mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
                {content.builder.stageFields.fields[1].label}
              </Text>
              <TextInput
                keyboardType="numeric"
                value={stage.stageValue}
                onChangeText={(text) => updateStage(index, { stageValue: text })}
                placeholder={content.builder.stageFields.fields[1].placeholder}
                className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-black bg-white mb-2.5"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              <Text className="text-gray-700 text-xs mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
                {content.builder.stageFields.fields[2].label}
              </Text>
              <View className="flex-row flex-wrap mb-2">
                {content.builder.stageFields.fields[2].options.map((proof) => {
                  const selected = stage.proofRequired.includes(proof);
                  return (
                    <TouchableOpacity
                      key={`${index}-${proof}`}
                      onPress={() => toggleProof(index, proof)}
                      className={`rounded-full px-3 py-1.5 mr-2 mb-2 border ${
                        selected ? 'bg-black border-black' : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-xs ${selected ? 'text-white' : 'text-gray-700'}`}
                        style={{ fontFamily: selected ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
                      >
                        {proof}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-gray-700 text-xs mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
                {content.builder.stageFields.fields[3].label}
              </Text>
              <TextInput
                value={stage.notes}
                onChangeText={(text) => updateStage(index, { notes: text })}
                placeholder={content.builder.stageFields.fields[3].placeholder}
                multiline
                numberOfLines={3}
                className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-black bg-white"
                style={{ fontFamily: 'Poppins_400Regular', textAlignVertical: 'top' }}
              />
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.resultSection.title}
          </SeoHeading>
          <Text className="text-gray-700 text-sm leading-6 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.resultSection.description}
          </Text>

          <View className="bg-gray-100 border border-gray-300 rounded-xl p-3 mb-3">
            <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              Project type: {projectType}
            </Text>
            <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              Total budget: {formatMoney(totalBudgetValue, currency)}
            </Text>
            <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              Contingency amount: {formatMoney(contingencyAmount, currency)}
            </Text>
            <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
              Usable stage budget after contingency: {formatMoney(usableBudget, currency)}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="min-w-[980px]">
              <View className="flex-row border border-gray-300 rounded-t-xl bg-gray-100">
                {content.paymentTableColumns.map((column) => (
                  <Text
                    key={column}
                    className="text-xs text-gray-700 px-3 py-2 border-r border-gray-300 last:border-r-0 w-[160px]"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {column}
                  </Text>
                ))}
              </View>
              {summaryRows.map((row, index) => (
                <View key={`${row.stageName}-${index}`} className="flex-row border-x border-b border-gray-300 bg-white">
                  <Text className="text-xs text-gray-800 px-3 py-2 border-r border-gray-200 w-[160px]" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {row.stageName}
                  </Text>
                  <Text className="text-xs text-gray-800 px-3 py-2 border-r border-gray-200 w-[160px]" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {formatMoney(row.stagePayment, currency)}
                  </Text>
                  <Text className="text-xs text-gray-700 px-3 py-2 border-r border-gray-200 w-[160px]" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {row.proofRequired.length > 0 ? row.proofRequired.join(', ') : '—'}
                  </Text>
                  <Text className="text-xs text-gray-700 px-3 py-2 border-r border-gray-200 w-[160px]" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {row.notes || '—'}
                  </Text>
                  <Text className="text-xs text-gray-800 px-3 py-2 border-r border-gray-200 w-[160px]" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {formatMoney(row.runningTotalPaid, currency)}
                  </Text>
                  <Text className="text-xs text-gray-800 px-3 py-2 w-[160px]" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {formatMoney(row.amountRemaining, currency)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View className="bg-gray-100 border border-gray-300 rounded-xl p-3">
            <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              Total allocated amount: {formatMoney(totalAllocatedAmount, currency)}
            </Text>
            <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              Total reserved contingency: {formatMoney(contingencyAmount, currency)}
            </Text>
            <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
              Unallocated balance: {formatMoney(Math.max(usableBudget - totalAllocatedAmount, 0), currency)}
            </Text>
          </View>
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
          {dynamicWarnings.length > 0 ? (
            <View className="mt-2 border-t border-white/20 pt-2">
              {dynamicWarnings.map((warning) => (
                <Text key={warning} className="text-white/95 text-sm leading-6 mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                  • {warning}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.suggestedDefaults.title}
          </SeoHeading>
          {Object.entries(content.suggestedDefaults.byProjectType).map(([type, defaults]) => (
            <View key={type} className="mb-2">
              <Text className="text-gray-900 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {type}
              </Text>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {defaults.join(' • ')}
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

        <InternalLinksBlock title={content.relatedResources.title} links={content.relatedResources.links} />

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

import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { cardShadowStyle } from '@/lib/card-styles';
import {
  ALIGNMENT_DISCUSSED_OPTIONS,
  BOT_OPTIONS,
  CAPITAL_CONTRIBUTION_OPTIONS,
  CONSTRUCTION_STAGE_OPTIONS,
  CURRENT_PROPERTY_OPTIONS,
  DECISION_MAKER_OPTIONS,
  DIRECT_REDEVELOPMENT_WHATSAPP_MESSAGE,
  DOCUMENT_OPTIONS,
  ENCUMBRANCE_OPTIONS,
  HELP_OPTIONS,
  INCOME_OPTIONS,
  INSPECTION_OPTIONS,
  LAND_SIZE_UNITS,
  OCCUPANCY_OPTIONS,
  OUTCOME_OPTIONS,
  OWNER_ALIGNMENT_OPTIONS,
  OWNER_OPTIONS,
  PAYMENT_OPTIONS,
  PLANNED_USE_OPTIONS,
  PRICE_CURRENCIES,
  REDEVELOPMENT_CHECK_ANCHOR,
  REDEVELOPMENT_CHECK_STORAGE_KEY,
  REMAINING_COST_OPTIONS,
  SELL_PART_OPTIONS,
  SEPARATE_ROLES_OPTIONS,
  SHARE_OPTIONS,
  STOP_REASONS,
  TIMELINE_OPTIONS,
  UNFINISHED_DURATION_OPTIONS,
  YES_NO,
  buildRedevelopmentWhatsAppMessage,
  emptyRedevelopmentBrief,
  formatMoney,
  landSizeLine,
  locationLine,
  toggleExclusive,
  validateRedevelopmentStep,
  type RedevelopmentBrief,
} from '@/lib/redevelopment-readiness-check';
import { BUILDMYHOUSE_WHATSAPP_URL } from '@/lib/whatsapp-support';

const STEPS = ['Property', 'Ownership', 'Project', 'Money', 'What you want', 'Support', 'Decision'] as const;

const inputClass = 'mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-black';

function openWhatsApp(message: string) {
  const url = `${BUILDMYHOUSE_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
  void Linking.openURL(url);
}

export function scrollToRedevelopmentCheck() {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.getElementById(REDEVELOPMENT_CHECK_ANCHOR)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

function ChoiceRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`mb-2 rounded-xl border px-3 py-3 ${selected ? 'border-black bg-black' : 'border-gray-200 bg-white'}`}
    >
      <Text className={`text-sm ${selected ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Poppins_500Medium' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="text-sm text-gray-800 mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
      {children}
    </Text>
  );
}

function Hint({ children }: { children: string }) {
  return (
    <Text className="text-xs text-gray-500 mt-1 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
      {children}
    </Text>
  );
}

function ReviewBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View className="mt-4">
      <Text className="text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {title}
      </Text>
      {lines.map((line) => (
        <Text key={`${title}-${line}`} className="text-sm text-gray-800 mt-1 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function readStoredBrief(): RedevelopmentBrief | null {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REDEVELOPMENT_CHECK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RedevelopmentBrief>;
    return { ...emptyRedevelopmentBrief(), ...parsed };
  } catch {
    return null;
  }
}

export default function RedevelopmentReadinessCheck() {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<RedevelopmentBrief>(emptyRedevelopmentBrief);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    const stored = readStoredBrief();
    if (stored) setBrief(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(REDEVELOPMENT_CHECK_STORAGE_KEY, JSON.stringify(brief));
    } catch {
      // A full browser store should not block the check.
    }
  }, [brief, hydrated]);

  const patch = (partial: Partial<RedevelopmentBrief>) => {
    setBrief((current) => ({ ...current, ...partial }));
  };

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackWebEvent('redevelopment_check_started');
  };

  const continueStep = () => {
    const problem = validateRedevelopmentStep(brief, step);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    markStarted();
    trackWebEvent('redevelopment_check_section_completed', { section: STEPS[step] });
    if (step === STEPS.length - 1) {
      setStep(STEPS.length);
      trackWebEvent('redevelopment_check_completed');
      return;
    }
    setStep((current) => current + 1);
  };

  const sendBrief = () => {
    trackWebEvent('redevelopment_check_whatsapp_clicked');
    openWhatsApp(buildRedevelopmentWhatsAppMessage(brief));
  };

  const talkFirst = () => {
    trackWebEvent('redevelopment_check_direct_whatsapp_clicked');
    openWhatsApp(DIRECT_REDEVELOPMENT_WHATSAPP_MESSAGE);
  };

  const incomeNeedsAmount = brief.income.startsWith('Yes') || brief.income === 'Partly' || brief.income === 'Other';
  const remainingNeedsAmount =
    brief.remainingCostKnown === 'Yes' || brief.remainingCostKnown === 'I have an old estimate';

  return (
    <View nativeID={REDEVELOPMENT_CHECK_ANCHOR} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-3xl p-4 md:p-6">
      <Text className="text-[11px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        Redevelopment Readiness Check
      </Text>
      <SeoHeading level={2} className="text-black text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        Have land or an unfinished property but need money or a development partner to move forward?
      </SeoHeading>
      <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
        Tell us what you have, what has already been built and what you want to achieve. BuildMyHouse will review the information and determine what type of professional assessment may be needed before the property can be considered for financing or a development partnership.
      </Text>
      <Text className="text-gray-800 text-sm leading-6 mt-3" style={{ fontFamily: 'Poppins_500Medium' }}>
        Completing this check does not guarantee that a developer or investor will accept your property.
      </Text>

      {step < STEPS.length ? (
        <View className="my-4">
          <Text className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </Text>
          <View className="flex-row gap-1">
            {STEPS.map((label, index) => (
              <View key={label} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-black' : 'bg-gray-200'}`} />
            ))}
          </View>
        </View>
      ) : null}

      {step === 0 ? (
        <View>
          <FieldLabel>Where is the property located?</FieldLabel>
          <TextInput value={brief.state} onChangeText={(state) => patch({ state })} placeholder="State" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <TextInput value={brief.city} onChangeText={(city) => patch({ city })} placeholder="City or local government area" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <TextInput value={brief.area} onChangeText={(area) => patch({ area })} placeholder="Neighbourhood or area" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <TextInput value={brief.address} onChangeText={(address) => patch({ address })} placeholder="Full address, if you are comfortable sharing it now" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <FieldLabel>What do you currently have?</FieldLabel>
          {CURRENT_PROPERTY_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.currentProperty === option} onPress={() => patch({ currentProperty: option })} />
          ))}
          <FieldLabel>What type of property was originally planned?</FieldLabel>
          {PLANNED_USE_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.plannedUse === option} onPress={() => patch({ plannedUse: option })} />
          ))}
          <FieldLabel>Approximate land size</FieldLabel>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {LAND_SIZE_UNITS.map((unit) => (
              <TouchableOpacity key={unit} accessibilityRole="button" onPress={() => patch({ landSizeUnit: unit, landSizeUnknown: false })} className={`rounded-full border px-3 py-2 ${brief.landSizeUnit === unit && !brief.landSizeUnknown ? 'bg-black border-black' : 'bg-white border-gray-200'}`}>
                <Text className={`text-xs ${brief.landSizeUnit === unit && !brief.landSizeUnknown ? 'text-white' : 'text-gray-800'}`} style={{ fontFamily: 'Poppins_500Medium' }}>{unit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {brief.landSizeUnknown ? null : (
            <TextInput value={brief.landSize} onChangeText={(landSize) => patch({ landSize })} placeholder="Approximate size" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          )}
          <ChoiceRow label="I don't know" selected={brief.landSizeUnknown} onPress={() => patch({ landSizeUnknown: !brief.landSizeUnknown, landSize: '' })} />
          <FieldLabel>Do you currently occupy or use any part of the property?</FieldLabel>
          {OCCUPANCY_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.occupancy === option} onPress={() => patch({ occupancy: option })} />
          ))}
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <FieldLabel>Who owns the property?</FieldLabel>
          {OWNER_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.owners === option} onPress={() => patch({ owners: option })} />
          ))}
          <FieldLabel>Do all people with an ownership interest agree that the property can potentially be developed with an outside partner?</FieldLabel>
          {OWNER_ALIGNMENT_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.ownersAligned === option} onPress={() => patch({ ownersAligned: option })} />
          ))}
          <FieldLabel>What property documents do you currently have?</FieldLabel>
          <Hint>Select every document you can lay hands on. This is not a legal opinion about whether those documents are enough.</Hint>
          {DOCUMENT_OPTIONS.map((option) => (
            <ChoiceRow
              key={option}
              label={option}
              selected={brief.documents.includes(option)}
              onPress={() => patch({ documents: toggleExclusive(brief.documents, option, ['I currently have none available']) })}
            />
          ))}
          <FieldLabel>Is the property currently subject to any of these?</FieldLabel>
          {ENCUMBRANCE_OPTIONS.map((option) => (
            <ChoiceRow
              key={option}
              label={option}
              selected={brief.encumbrances.includes(option)}
              onPress={() => patch({ encumbrances: toggleExclusive(brief.encumbrances, option, ['None that I know of']) })}
            />
          ))}
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <FieldLabel>If construction started, when did work stop?</FieldLabel>
          <TextInput value={brief.stoppedWhen} onChangeText={(stoppedWhen) => patch({ stoppedWhen })} placeholder="Year or approximate period. Leave blank if work never started." placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <FieldLabel>Why did construction stop?</FieldLabel>
          {STOP_REASONS.map((option) => (
            <ChoiceRow
              key={option}
              label={option}
              selected={brief.stopReasons.includes(option)}
              onPress={() => patch({ stopReasons: toggleExclusive(brief.stopReasons, option, []) })}
            />
          ))}
          <FieldLabel>Approximately how long has the structure been sitting unfinished?</FieldLabel>
          {UNFINISHED_DURATION_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.unfinishedDuration === option} onPress={() => patch({ unfinishedDuration: option })} />
          ))}
          <FieldLabel>What stage has construction reached?</FieldLabel>
          <Hint>First fix / MEP means the early electrical, plumbing and mechanical work inside the building.</Hint>
          {CONSTRUCTION_STAGE_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.constructionStage === option} onPress={() => patch({ constructionStage: option })} />
          ))}
          <FieldLabel>Do you have recent photos or videos of the property?</FieldLabel>
          {YES_NO.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.hasPhotos === option} onPress={() => patch({ hasPhotos: option })} />
          ))}
          {brief.hasPhotos === 'Yes' ? (
            <Hint>You can send the photos and videos on WhatsApp after this check. You do not need to upload them here.</Hint>
          ) : null}
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          <FieldLabel>Approximately how much have you invested so far?</FieldLabel>
          <Hint>This helps us understand your position, but money already spent does not by itself determine what the property is worth today.</Hint>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {PRICE_CURRENCIES.map((currency) => (
              <TouchableOpacity key={currency} accessibilityRole="button" onPress={() => patch({ investedCurrency: currency, investedUndisclosed: false })} className={`rounded-full border px-3 py-2 ${brief.investedCurrency === currency && !brief.investedUndisclosed ? 'bg-black border-black' : 'bg-white border-gray-200'}`}>
                <Text className={`text-xs ${brief.investedCurrency === currency && !brief.investedUndisclosed ? 'text-white' : 'text-gray-800'}`} style={{ fontFamily: 'Poppins_500Medium' }}>{currency}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {brief.investedUndisclosed ? null : (
            <TextInput value={brief.investedAmount} onChangeText={(investedAmount) => patch({ investedAmount })} placeholder="Approximate amount" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          )}
          <ChoiceRow label="I don't know / I prefer not to say yet" selected={brief.investedUndisclosed} onPress={() => patch({ investedUndisclosed: !brief.investedUndisclosed, investedAmount: '' })} />
          <FieldLabel>Do you know approximately how much is still required to complete the original project?</FieldLabel>
          {REMAINING_COST_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.remainingCostKnown === option} onPress={() => patch({ remainingCostKnown: option })} />
          ))}
          {remainingNeedsAmount ? (
            <View>
              <FieldLabel>Approximate amount still required</FieldLabel>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {PRICE_CURRENCIES.map((currency) => (
                  <TouchableOpacity key={currency} accessibilityRole="button" onPress={() => patch({ remainingCurrency: currency })} className={`rounded-full border px-3 py-2 ${brief.remainingCurrency === currency ? 'bg-black border-black' : 'bg-white border-gray-200'}`}>
                    <Text className={`text-xs ${brief.remainingCurrency === currency ? 'text-white' : 'text-gray-800'}`} style={{ fontFamily: 'Poppins_500Medium' }}>{currency}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput value={brief.remainingAmount} onChangeText={(remainingAmount) => patch({ remainingAmount })} placeholder="Approximate amount" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
            </View>
          ) : null}
          <FieldLabel>Could you personally contribute additional money if the right structure is found?</FieldLabel>
          {CAPITAL_CONTRIBUTION_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.canContribute === option} onPress={() => patch({ canContribute: option })} />
          ))}
          <FieldLabel>Does the property currently generate any income?</FieldLabel>
          {INCOME_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.income === option} onPress={() => patch({ income: option })} />
          ))}
          {incomeNeedsAmount ? (
            <View>
              <FieldLabel>Approximate income, if you know it</FieldLabel>
              <Hint>Monthly or yearly is fine. You can leave this blank.</Hint>
              <TextInput value={brief.incomeAmount} onChangeText={(incomeAmount) => patch({ incomeAmount })} placeholder="Optional" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 4 ? (
        <View>
          <FieldLabel>At the end of the arrangement, what matters most to you?</FieldLabel>
          {OUTCOME_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.outcomes.includes(option)} onPress={() => patch({ outcomes: toggleExclusive(brief.outcomes, option, []) })} />
          ))}
          <FieldLabel>Would you consider sharing part of the completed development with a developer in exchange for the developer funding the project?</FieldLabel>
          <Hint>This type of arrangement is commonly called a joint venture: you contribute the property while the developer contributes development capital and execution, and both sides share the resulting value according to an agreement.</Hint>
          {SHARE_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.openToSharing === option} onPress={() => patch({ openToSharing: option })} />
          ))}
          <FieldLabel>Would you consider allowing a developer to build and operate an income-producing development for an agreed period before control or rights return according to the agreement?</FieldLabel>
          <Hint>This is commonly called Build–Operate–Transfer. It normally makes sense only where the completed property can generate enough income to support the arrangement.</Hint>
          {BOT_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.openToBot === option} onPress={() => patch({ openToBot: option })} />
          ))}
          <FieldLabel>Would you consider a structure where an investor provides capital and a separate developer handles construction?</FieldLabel>
          <Hint>The person with the money and the company that builds do not have to be the same party.</Hint>
          {SEPARATE_ROLES_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.openToSeparateRoles === option} onPress={() => patch({ openToSeparateRoles: option })} />
          ))}
          <FieldLabel>Would you consider selling only part of the land or property if doing so could fund the part you want to retain?</FieldLabel>
          {SELL_PART_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.openToSellingPart === option} onPress={() => patch({ openToSellingPart: option })} />
          ))}
        </View>
      ) : null}

      {step === 5 ? (
        <View>
          <FieldLabel>What would you like BuildMyHouse to help with?</FieldLabel>
          {HELP_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.helpRequested.includes(option)} onPress={() => patch({ helpRequested: toggleExclusive(brief.helpRequested, option, []) })} />
          ))}
          <FieldLabel>Serious developers and investors normally need verified information before evaluating a property. Are you willing to allow BuildMyHouse and relevant professionals to inspect the property and review the available documents?</FieldLabel>
          {INSPECTION_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.allowInspection === option} onPress={() => patch({ allowInspection: option })} />
          ))}
          <FieldLabel>Some of this work may require paid professionals such as lawyers, surveyors, valuers, architects, engineers or quantity surveyors. If needed, are you prepared to pay for the professional assessment required to make the opportunity ready for a serious review?</FieldLabel>
          {PAYMENT_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.payForAssessment === option} onPress={() => patch({ payForAssessment: option })} />
          ))}
          <FieldLabel>How soon would you like to move forward?</FieldLabel>
          {TIMELINE_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.timeline === option} onPress={() => patch({ timeline: option })} />
          ))}
        </View>
      ) : null}

      {step === 6 ? (
        <View>
          <FieldLabel>Who must approve a development arrangement?</FieldLabel>
          {DECISION_MAKER_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.decisionMakers === option} onPress={() => patch({ decisionMakers: option })} />
          ))}
          <FieldLabel>Have those people already discussed the idea?</FieldLabel>
          {ALIGNMENT_DISCUSSED_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.decisionDiscussed === option} onPress={() => patch({ decisionDiscussed: option })} />
          ))}
          <FieldLabel>Full name</FieldLabel>
          <TextInput value={brief.name} onChangeText={(name) => patch({ name })} placeholder="Your name" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <FieldLabel>Email</FieldLabel>
          <TextInput value={brief.email} onChangeText={(email) => patch({ email })} placeholder="you@email.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <FieldLabel>WhatsApp number</FieldLabel>
          <TextInput value={brief.whatsapp} onChangeText={(whatsapp) => patch({ whatsapp })} placeholder="+234..." placeholderTextColor="#9ca3af" keyboardType="phone-pad" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <FieldLabel>Current country of residence</FieldLabel>
          <TextInput value={brief.country} onChangeText={(country) => patch({ country })} placeholder="Nigeria, United Kingdom, United States..." placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <FieldLabel>How did you hear about BuildMyHouse?</FieldLabel>
          <Hint>Optional.</Hint>
          <TextInput value={brief.heardAbout} onChangeText={(heardAbout) => patch({ heardAbout })} placeholder="Optional" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
        </View>
      ) : null}

      {step === STEPS.length ? (
        <View className="mt-4">
          <Text className="text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Your redevelopment brief
          </Text>
          <ReviewBlock
            title="Property"
            lines={[locationLine(brief), brief.currentProperty, `Land size: ${landSizeLine(brief)}`, brief.plannedUse, `In use: ${brief.occupancy}`]}
          />
          <ReviewBlock
            title="Ownership"
            lines={[brief.owners, `Aligned: ${brief.ownersAligned}`, `Documents: ${brief.documents.join(', ') || 'None selected'}`, `Claims: ${brief.encumbrances.join(', ') || 'None selected'}`]}
          />
          <ReviewBlock
            title="Current building stage"
            lines={[brief.constructionStage, `Stopped: ${brief.stoppedWhen || 'Not stated'}`, `Sitting unfinished: ${brief.unfinishedDuration}`, `Photos or videos: ${brief.hasPhotos}`]}
          />
          <ReviewBlock title="Why work stopped" lines={brief.stopReasons} />
          <ReviewBlock
            title="Financial position"
            lines={[
              `Already spent: ${formatMoney(brief.investedAmount, brief.investedCurrency, brief.investedUndisclosed)}`,
              `Remaining: ${brief.remainingCostKnown}${remainingNeedsAmount ? ` (${formatMoney(brief.remainingAmount, brief.remainingCurrency, false)})` : ''}`,
              `Can add money: ${brief.canContribute}`,
              `Income: ${brief.income}${brief.incomeAmount.trim() ? ` (${brief.incomeAmount.trim()})` : ''}`,
            ]}
          />
          <ReviewBlock title="Owner's desired outcome" lines={brief.outcomes} />
          <ReviewBlock
            title="Partnership flexibility"
            lines={[
              `Share completed value: ${brief.openToSharing}`,
              `Build, operate, then transfer: ${brief.openToBot}`,
              `Separate investor and developer: ${brief.openToSeparateRoles}`,
              `Sell part: ${brief.openToSellingPart}`,
            ]}
          />
          <ReviewBlock title="Service request" lines={brief.helpRequested} />
          <ReviewBlock
            title="Readiness for professional assessment"
            lines={[`Inspection and documents: ${brief.allowInspection}`, `Pay for assessment: ${brief.payForAssessment}`]}
          />
          <ReviewBlock
            title="Decision makers"
            lines={[brief.decisionMakers, `Discussed: ${brief.decisionDiscussed}`, `${brief.name} · ${brief.email}`, `${brief.whatsapp} · ${brief.country}`]}
          />
          <ReviewBlock title="Timeline" lines={[brief.timeline]} />
          <TouchableOpacity accessibilityRole="button" onPress={() => setStep(0)} className="mt-4">
            <Text className="text-sm underline text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={sendBrief} className="mt-4 rounded-2xl bg-black px-4 py-4">
            <Text className="text-white text-center text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Send my property brief to BuildMyHouse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={talkFirst} className="mt-3 rounded-2xl border border-black px-4 py-4">
            <Text className="text-black text-center text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              I need someone to explain my options first
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row gap-2 mt-4">
          {step > 0 ? (
            <TouchableOpacity accessibilityRole="button" onPress={() => { setError(''); setStep((current) => current - 1); }} className="flex-1 rounded-2xl border border-black px-4 py-3">
              <Text className="text-black text-center text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Back
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity accessibilityRole="button" onPress={continueStep} className="flex-1 rounded-2xl bg-black px-4 py-3">
            <Text className="text-white text-center text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {step === STEPS.length - 1 ? 'Review' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {error ? (
        <Text className="text-red-700 text-sm mt-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          {error}
        </Text>
      ) : null}

      <Text className="text-xs text-gray-500 leading-5 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        Property and investment arrangements can create significant legal, financial, tax and regulatory consequences. BuildMyHouse coordinates property and project processes but does not replace independent legal, financial, surveying, valuation, tax or investment advice appropriate to a specific transaction.
      </Text>
    </View>
  );
}

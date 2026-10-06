import { useRef, useState } from 'react';
import { Linking, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { cardShadowStyle } from '@/lib/card-styles';
import {
  DECISION_MAKER_OPTIONS,
  DECISION_TIMELINES,
  DIRECT_PROPERTY_PURCHASE_WHATSAPP_MESSAGE,
  DOCUMENT_OPTIONS,
  HOW_FOUND_OPTIONS,
  PAYMENT_READINESS_OPTIONS,
  PRICE_CURRENCIES,
  PROPERTY_PURCHASE_CHECK_ANCHOR,
  PROPERTY_TYPES,
  PURCHASE_CONCERNS,
  PURCHASE_STAGES,
  SERVICE_READINESS_OPTIONS,
  buildPropertyPurchaseWhatsAppMessage,
  emptyPropertyPurchaseBrief,
  formatAskingPrice,
  type PropertyPurchaseBrief,
} from '@/lib/property-purchase-safety-check';
import { BUILDMYHOUSE_WHATSAPP_URL } from '@/lib/whatsapp-support';

const STEPS = ['Property', 'Stage', 'Concerns', 'Documents', 'Readiness'] as const;

const inputClass = 'mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-black';

function openWhatsApp(message: string) {
  const url = `${BUILDMYHOUSE_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
  void Linking.openURL(url);
}

export function scrollToPropertyPurchaseCheck() {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.getElementById(PROPERTY_PURCHASE_CHECK_ANCHOR)?.scrollIntoView({
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

export default function PropertyPurchaseSafetyCheck() {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<PropertyPurchaseBrief>(emptyPropertyPurchaseBrief);
  const [error, setError] = useState('');
  const [readyMessage, setReadyMessage] = useState('');
  const started = useRef(false);

  const patch = (partial: Partial<PropertyPurchaseBrief>) => {
    setBrief((current) => ({ ...current, ...partial }));
  };

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackWebEvent('article_property_purchase_tool_started');
  };

  const toggleList = (key: 'concerns' | 'documents', value: string) => {
    setBrief((current) => {
      const selected = current[key].includes(value);
      let next = selected ? current[key].filter((item) => item !== value) : [...current[key], value];
      if (key === 'documents' && value === 'None yet' && !selected) next = ['None yet'];
      if (key === 'documents' && value !== 'None yet') next = next.filter((item) => item !== 'None yet');
      return { ...current, [key]: next };
    });
  };

  const validate = (index: number) => {
    if (index === 0) {
      if (!brief.location.trim()) return 'Tell us where in Lagos the property is.';
      if (!brief.propertyType) return 'Choose the type of property.';
      if (!brief.priceUndisclosed && !brief.priceAmount.trim()) return 'Enter the asking price, or say you prefer not to share it yet.';
      if (!brief.inNigeria) return 'Tell us whether you are currently in Nigeria.';
      if (brief.inNigeria === 'No' && !brief.currentBase.trim()) return 'Tell us where you are currently based.';
      if (!brief.foundVia) return 'Tell us how you found the property.';
    }
    if (index === 1) {
      if (!brief.stage) return 'Choose the stage you are at.';
      if (!brief.timeline) return 'Choose how soon you hope to decide.';
    }
    if (index === 2 && brief.concerns.length === 0) return 'Select at least one thing that is making you uneasy.';
    if (index === 3 && brief.documents.length === 0) return 'Select the documents you have, or choose None yet.';
    if (index === 4) {
      if (!brief.serviceReadiness) return 'Tell us whether you want the checks coordinated.';
      if (!brief.payForChecks) return 'Tell us whether you are prepared to pay for professional checks.';
      if (!brief.decisionMaker) return 'Tell us who makes the final purchase decision.';
      if (!brief.name.trim()) return 'Enter your name.';
      if (!brief.email.trim().includes('@')) return 'Enter an email address.';
      if (brief.whatsapp.replace(/\D/g, '').length < 8) return 'Enter a WhatsApp number we can reach.';
    }
    return '';
  };

  const continueStep = () => {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    markStarted();
    if (step === 4) {
      const message = buildPropertyPurchaseWhatsAppMessage(brief);
      setReadyMessage(message);
      setStep(6);
      trackWebEvent('article_property_purchase_tool_completed');
      return;
    }
    setStep((current) => (current === 5 ? 6 : current + 1));
  };

  const goReview = () => {
    const problem = validate(4);
    if (problem) {
      setError(problem);
      setStep(4);
      return;
    }
    setError('');
    setStep(5);
  };

  const sendBrief = () => {
    trackWebEvent('article_property_purchase_whatsapp_clicked');
    openWhatsApp(readyMessage || buildPropertyPurchaseWhatsAppMessage(brief));
  };

  const talkFirst = () => {
    trackWebEvent('article_property_purchase_direct_whatsapp_clicked', { placement: 'tool' });
    openWhatsApp(DIRECT_PROPERTY_PURCHASE_WHATSAPP_MESSAGE);
  };

  const progressIndex = Math.min(step, 4);

  return (
    <View
      nativeID={PROPERTY_PURCHASE_CHECK_ANCHOR}
      style={cardShadowStyle}
      className="bg-white border border-gray-200 rounded-3xl p-4 md:p-6"
    >
      <Text className="text-[11px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        Property Purchase Safety Check
      </Text>
      <SeoHeading level={2} className="text-black text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        Considering a Lagos property? Tell us what worries you before you commit.
      </SeoHeading>
      <Text className="text-gray-600 text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        This is not a free technical inspection or a free legal opinion. It organises what you already know so BuildMyHouse can prepare a proposal. Lawyers, surveyors, engineers and a site visit are specialist work, and they are quoted separately. You can send documents on WhatsApp after this. You do not need an account.
      </Text>

      {step < 5 ? (
        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Step {progressIndex + 1} of {STEPS.length}: {STEPS[progressIndex]}
          </Text>
          <View className="flex-row gap-1">
            {STEPS.map((label, index) => (
              <View key={label} className={`h-1.5 flex-1 rounded-full ${index <= progressIndex ? 'bg-black' : 'bg-gray-200'}`} />
            ))}
          </View>
        </View>
      ) : null}

      {step === 0 ? (
        <View>
          <FieldLabel>Where in Lagos is the property located?</FieldLabel>
          <TextInput
            value={brief.location}
            onChangeText={(location) => patch({ location })}
            placeholder="Estate, street, or area"
            placeholderTextColor="#9ca3af"
            className={inputClass}
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          <FieldLabel>What type of property are you considering?</FieldLabel>
          {PROPERTY_TYPES.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.propertyType === option} onPress={() => patch({ propertyType: option })} />
          ))}
          <FieldLabel>What is the seller’s asking price?</FieldLabel>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {PRICE_CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency}
                onPress={() => patch({ priceCurrency: currency, priceUndisclosed: false })}
                className={`rounded-full border px-3 py-2 ${brief.priceCurrency === currency && !brief.priceUndisclosed ? 'bg-black border-black' : 'border-gray-300 bg-white'}`}
              >
                <Text className={`text-xs ${brief.priceCurrency === currency && !brief.priceUndisclosed ? 'text-white' : 'text-gray-800'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={brief.priceAmount}
            onChangeText={(priceAmount) => patch({ priceAmount, priceUndisclosed: false })}
            placeholder="Amount"
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
            className={inputClass}
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          <ChoiceRow
            label="I prefer not to say yet"
            selected={brief.priceUndisclosed}
            onPress={() => patch({ priceUndisclosed: !brief.priceUndisclosed, priceAmount: '' })}
          />
          <FieldLabel>Are you currently in Nigeria?</FieldLabel>
          <ChoiceRow label="Yes" selected={brief.inNigeria === 'Yes'} onPress={() => patch({ inNigeria: 'Yes' })} />
          <ChoiceRow label="No" selected={brief.inNigeria === 'No'} onPress={() => patch({ inNigeria: 'No' })} />
          {brief.inNigeria === 'No' ? (
            <>
              <FieldLabel>Where are you currently based?</FieldLabel>
              <TextInput
                value={brief.currentBase}
                onChangeText={(currentBase) => patch({ currentBase })}
                placeholder="City and country"
                placeholderTextColor="#9ca3af"
                className={inputClass}
                style={{ fontFamily: 'Poppins_400Regular' }}
              />
            </>
          ) : null}
          <FieldLabel>How did you find the property?</FieldLabel>
          {HOW_FOUND_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.foundVia === option} onPress={() => patch({ foundVia: option })} />
          ))}
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <FieldLabel>What stage are you at?</FieldLabel>
          {PURCHASE_STAGES.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.stage === option} onPress={() => patch({ stage: option })} />
          ))}
          <FieldLabel>How soon do you hope to decide?</FieldLabel>
          {DECISION_TIMELINES.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.timeline === option} onPress={() => patch({ timeline: option })} />
          ))}
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <FieldLabel>What worries you? Choose every point that applies.</FieldLabel>
          {PURCHASE_CONCERNS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.concerns.includes(option)} onPress={() => toggleList('concerns', option)} />
          ))}
          <FieldLabel>Tell us anything else making you uncomfortable about this purchase.</FieldLabel>
          <TextInput
            value={brief.otherConcern}
            onChangeText={(otherConcern) => patch({ otherConcern })}
            placeholder="Optional"
            multiline
            placeholderTextColor="#9ca3af"
            className={`${inputClass} min-h-[96px]`}
            style={{ fontFamily: 'Poppins_400Regular', textAlignVertical: 'top' }}
          />
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          <FieldLabel>Which documents or evidence do you currently have?</FieldLabel>
          <Text className="text-gray-500 text-xs mt-1 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            Do not upload them here. After you send the brief, you can pass the files through WhatsApp.
          </Text>
          {DOCUMENT_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.documents.includes(option)} onPress={() => toggleList('documents', option)} />
          ))}
        </View>
      ) : null}

      {step === 4 ? (
        <View>
          <FieldLabel>Are you looking for BuildMyHouse to coordinate independent verification and inspection before you purchase?</FieldLabel>
          {SERVICE_READINESS_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.serviceReadiness === option} onPress={() => patch({ serviceReadiness: option })} />
          ))}
          <FieldLabel>
            Professional property verification and technical inspection may require paid lawyers, surveyors, engineers or other specialists. If BuildMyHouse recommends these checks, are you prepared to pay for the required professional work before making your purchase decision?
          </FieldLabel>
          {PAYMENT_READINESS_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.payForChecks === option} onPress={() => patch({ payForChecks: option })} />
          ))}
          <FieldLabel>Who makes the final purchase decision?</FieldLabel>
          {DECISION_MAKER_OPTIONS.map((option) => (
            <ChoiceRow key={option} label={option} selected={brief.decisionMaker === option} onPress={() => patch({ decisionMaker: option })} />
          ))}
          <FieldLabel>Name</FieldLabel>
          <TextInput value={brief.name} onChangeText={(name) => patch({ name })} placeholder="Your name" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <FieldLabel>Email</FieldLabel>
          <TextInput value={brief.email} onChangeText={(email) => patch({ email })} autoCapitalize="none" keyboardType="email-address" placeholder="you@email.com" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
          <FieldLabel>WhatsApp number</FieldLabel>
          <TextInput value={brief.whatsapp} onChangeText={(whatsapp) => patch({ whatsapp })} keyboardType="phone-pad" placeholder="Include country code" placeholderTextColor="#9ca3af" className={inputClass} style={{ fontFamily: 'Poppins_400Regular' }} />
        </View>
      ) : null}

      {step === 5 ? (
        <View>
          <SeoHeading level={3} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Review your brief
          </SeoHeading>
          <Summary brief={brief} />
        </View>
      ) : null}

      {step === 6 ? (
        <View>
          <SeoHeading level={3} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Your Property Purchase Brief Is Ready
          </SeoHeading>
          <Text className="text-gray-600 text-sm leading-6 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            Send this to BuildMyHouse on WhatsApp. We will use it to recommend the checks for this property and to prepare a proposal. Specialist verification and inspection are paid work.
          </Text>
          <Summary brief={brief} />
          <TouchableOpacity onPress={sendBrief} className="rounded-full bg-black px-5 py-3 mt-4">
            <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
              Send My Brief to BuildMyHouse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={talkFirst} className="rounded-full border border-gray-300 px-5 py-3 mt-2">
            <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              I prefer to talk to BuildMyHouse first
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? (
        <Text className="text-red-600 text-sm mt-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          {error}
        </Text>
      ) : null}

      {step < 6 ? (
        <View className="flex-row gap-2 mt-4">
          {step > 0 ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setError('');
                setStep((current) => current - 1);
              }}
              className="rounded-full border border-gray-300 px-5 py-3"
            >
              <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Back
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={step === 5 ? () => { setReadyMessage(buildPropertyPurchaseWhatsAppMessage(brief)); setStep(6); trackWebEvent('article_property_purchase_tool_completed'); } : step === 4 ? goReview : continueStep}
            className="flex-1 rounded-full bg-black px-5 py-3"
          >
            <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
              {step === 4 ? 'Review my brief' : step === 5 ? 'Prepare my brief' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {step < 6 ? (
        <TouchableOpacity onPress={talkFirst} className="mt-3">
          <Text className="text-gray-600 text-sm underline text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
            I prefer to talk to BuildMyHouse first
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function Summary({ brief }: { brief: PropertyPurchaseBrief }) {
  const rows = [
    ['Location', brief.location],
    ['Property type', brief.propertyType],
    ['Asking price', formatAskingPrice(brief)],
    ['Currently based', brief.inNigeria === 'Yes' ? 'Nigeria' : brief.currentBase],
    ['Found through', brief.foundVia],
    ['Stage', brief.stage],
    ['Decision timeline', brief.timeline],
    ['Concerns', brief.concerns.join(', ')],
    ['Anything else', brief.otherConcern || '—'],
    ['Documents', brief.documents.join(', ')],
    ['Coordinate checks', brief.serviceReadiness],
    ['Pay for professional work', brief.payForChecks],
    ['Decision maker', brief.decisionMaker],
    ['Name', brief.name],
    ['Email', brief.email],
    ['WhatsApp', brief.whatsapp],
  ];
  return (
    <View className="rounded-2xl bg-gray-50 border border-gray-200 p-3">
      {rows.map(([label, value]) => (
        <Text key={label} className="text-sm text-gray-700 leading-6 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{label}: </Text>
          {value || '—'}
        </Text>
      ))}
    </View>
  );
}

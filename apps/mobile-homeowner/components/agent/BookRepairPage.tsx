import { createElement, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, CalendarBlank, CheckCircle } from 'phosphor-react-native';
import WebLandmark from '@/components/seo/WebLandmark';
import { SeoContentBackButton } from '@/components/seo/SeoContentLayout';
import {
  BOOK_REPAIR_TIME_SLOTS,
  PLATFORM_SERVICE_FEE_OFFER,
  REPAIR_PRICING_GUIDE,
} from '@/lib/agent-seo-content';
import { BUILDMYHOUSE_CONTACT } from '@/lib/home-landing-content';
import { buildWhatsAppServiceRequestUrl } from '@/lib/whatsapp-support';

const BOOKING_SERVICES = [
  ...REPAIR_PRICING_GUIDE.map((item) => ({ value: item.service, label: item.service })),
  { value: 'Other repair or maintenance', label: 'Other repair or maintenance' },
];

function formatNgn(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function BookRepairPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ service?: string }>();
  const initialService =
    typeof params.service === 'string' && params.service.trim() ? params.service.trim() : '';

  const [service, setService] = useState(initialService || BOOKING_SERVICES[0]?.value || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<string>(BOOK_REPAIR_TIME_SLOTS[0]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const buildSummary = () =>
    [
      `Service: ${service}`,
      `Preferred date: ${preferredDate}`,
      `Time window: ${timeSlot}`,
      `Name: ${fullName}`,
      `Phone: ${phone}`,
      `Lagos area: ${area}`,
      details.trim() ? `Details: ${details.trim()}` : null,
      'BuildMyHouse repair booking (platform service fee currently free).',
    ]
      .filter(Boolean)
      .join('\n');

  const handleSubmit = () => {
    if (!service || !preferredDate || !timeSlot || !fullName.trim() || !phone.trim() || !area.trim()) {
      return;
    }
    setSubmitted(true);
  };

  const continueInApp = () => {
    const query = new URLSearchParams({
      service,
      date: preferredDate,
      slot: timeSlot,
    });
    router.push(`/start-repair?${query.toString()}` as any);
  };

  const openWhatsApp = () => {
    void Linking.openURL(buildWhatsAppServiceRequestUrl(buildSummary()));
  };

  const fieldLabelClass = 'text-sm text-slate-600 mb-1.5';
  const fieldLabelStyle = { fontFamily: 'Poppins_500Medium' } as const;
  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-black bmh-book-field';

  const formFields = (
    <>
      <View className="mb-4">
        <Text className={fieldLabelClass} style={fieldLabelStyle}>
          Repair service <Text className="text-red-500">*</Text>
        </Text>
        {Platform.OS === 'web' ? (
          createElement(
            'select',
            {
              name: 'service',
              required: true,
              value: service,
              className: inputClass,
              onChange: (event: any) => setService(event.target.value),
            },
            ...BOOKING_SERVICES.map((option) =>
              createElement('option', { key: option.value, value: option.value }, option.label),
            ),
          )
        ) : (
          <TextInput value={service} onChangeText={setService} className={inputClass} />
        )}
      </View>

      <View className="flex-col md:flex-row gap-4 mb-4">
        <View className="flex-1">
          <Text className={fieldLabelClass} style={fieldLabelStyle}>
            Preferred date <Text className="text-red-500">*</Text>
          </Text>
          {Platform.OS === 'web' ? (
            createElement('input', {
              type: 'date',
              name: 'preferredDate',
              required: true,
              min: minDate,
              value: preferredDate,
              className: inputClass,
              onChange: (event: any) => setPreferredDate(event.target.value),
            })
          ) : (
            <TextInput
              value={preferredDate}
              onChangeText={setPreferredDate}
              placeholder="YYYY-MM-DD"
              className={inputClass}
            />
          )}
        </View>
        <View className="flex-1">
          <Text className={fieldLabelClass} style={fieldLabelStyle}>
            Preferred time <Text className="text-red-500">*</Text>
          </Text>
          {Platform.OS === 'web' ? (
            createElement(
              'select',
              {
                name: 'timeSlot',
                required: true,
                value: timeSlot,
                className: inputClass,
                onChange: (event: any) => setTimeSlot(event.target.value),
              },
              ...BOOK_REPAIR_TIME_SLOTS.map((slot) => createElement('option', { key: slot, value: slot }, slot)),
            )
          ) : (
            <TextInput value={timeSlot} onChangeText={setTimeSlot} className={inputClass} />
          )}
        </View>
      </View>

      <View className="mb-4">
        <Text className={fieldLabelClass} style={fieldLabelStyle}>
          Full name <Text className="text-red-500">*</Text>
        </Text>
        {Platform.OS === 'web' ? (
          createElement('input', {
            type: 'text',
            name: 'fullName',
            required: true,
            autoComplete: 'name',
            value: fullName,
            className: inputClass,
            onChange: (event: any) => setFullName(event.target.value),
          })
        ) : (
          <TextInput value={fullName} onChangeText={setFullName} className={inputClass} />
        )}
      </View>

      <View className="mb-4">
        <Text className={fieldLabelClass} style={fieldLabelStyle}>
          Phone (WhatsApp) <Text className="text-red-500">*</Text>
        </Text>
        {Platform.OS === 'web' ? (
          createElement('input', {
            type: 'tel',
            name: 'phone',
            required: true,
            autoComplete: 'tel',
            inputMode: 'tel',
            value: phone,
            className: inputClass,
            onChange: (event: any) => setPhone(event.target.value),
          })
        ) : (
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" className={inputClass} />
        )}
      </View>

      <View className="mb-4">
        <Text className={fieldLabelClass} style={fieldLabelStyle}>
          Lagos area / property location <Text className="text-red-500">*</Text>
        </Text>
        {Platform.OS === 'web' ? (
          createElement('input', {
            type: 'text',
            name: 'area',
            required: true,
            autoComplete: 'address-level2',
            placeholder: 'e.g. Lekki Phase 1, Ikeja, Yaba',
            value: area,
            className: inputClass,
            onChange: (event: any) => setArea(event.target.value),
          })
        ) : (
          <TextInput value={area} onChangeText={setArea} className={inputClass} />
        )}
      </View>

      <View className="mb-6">
        <Text className={fieldLabelClass} style={fieldLabelStyle}>
          Problem details (optional)
        </Text>
        {Platform.OS === 'web' ? (
          createElement('textarea', {
            name: 'details',
            rows: 4,
            value: details,
            className: `${inputClass} min-h-[112px]`,
            placeholder: 'Describe the fault, urgency, and any photos you can share later.',
            onChange: (event: any) => setDetails(event.target.value),
          })
        ) : (
          <TextInput
            value={details}
            onChangeText={setDetails}
            multiline
            className={`${inputClass} min-h-[112px]`}
          />
        )}
      </View>

      {Platform.OS !== 'web' ? (
        <Pressable
          onPress={handleSubmit}
          className="h-12 rounded-xl bg-black items-center justify-center flex-row gap-2 bmh-glass-btn bmh-glass-btn-dark"
          accessibilityRole="button"
        >
          <CalendarBlank size={18} color="#fff" weight="bold" />
          <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Schedule repair intake
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View className="flex-1 bg-white min-h-screen">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <WebLandmark tag="header" className="border-b border-slate-100 bg-white">
          <View className="max-w-3xl w-full self-center px-5 md:px-8 py-4 flex-row items-center justify-between">
            <Link href={'/' as any} asChild>
              <Pressable accessibilityRole="link">
                <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                  BuildMyHouse
                </Text>
              </Pressable>
            </Link>
            <Link href={'/pricing/repairs' as any} asChild>
              <Pressable accessibilityRole="link">
                <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Repair pricing
                </Text>
              </Pressable>
            </Link>
          </View>
        </WebLandmark>

        <WebLandmark tag="main" className="max-w-3xl w-full self-center px-5 md:px-8 py-8 md:py-12">
          <SeoContentBackButton fallbackHref="/" />

          {Platform.OS === 'web'
            ? createElement(
                'h1',
                {
                  className: 'text-3xl md:text-4xl text-black mb-3',
                  style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
                },
                'Book a verified repair in Lagos',
              )
            : (
                <Text
                  accessibilityRole="header"
                  className="text-3xl text-black mb-3"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Book a verified repair in Lagos
                </Text>
              )}

          <Text className="text-base text-slate-600 leading-relaxed mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            {PLATFORM_SERVICE_FEE_OFFER.description} Choose your service and preferred visit window — no phone tag required.
          </Text>

          <View className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 mb-8">
            <Text className="text-sm text-emerald-900" style={{ fontFamily: 'Poppins_500Medium' }}>
              Platform service fee: <Text style={{ fontFamily: 'Poppins_700Bold' }}>₦0 (free for now)</Text>. You pay the verified contractor quote only, in staged milestones with evidence.
            </Text>
          </View>

          {!submitted ? (
            Platform.OS === 'web' ? (
              createElement(
                'form',
                {
                  className: 'bmh-book-repair-form',
                  onSubmit: (event: any) => {
                    event.preventDefault();
                    handleSubmit();
                  },
                },
                formFields,
                createElement(
                  'button',
                  {
                    type: 'submit',
                    className:
                      'h-12 w-full rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 mt-2 bmh-glass-btn bmh-glass-btn-dark',
                  },
                  'Schedule repair intake',
                ),
              )
            ) : (
              <>
                {formFields}
                <Pressable
                  onPress={handleSubmit}
                  className="h-12 rounded-xl bg-black items-center justify-center flex-row gap-2 bmh-glass-btn bmh-glass-btn-dark"
                  accessibilityRole="button"
                >
                  <CalendarBlank size={18} color="#fff" weight="bold" />
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Schedule repair intake
                  </Text>
                </Pressable>
              </>
            )
          ) : (
            <View className="rounded-2xl border border-slate-200 bg-slate-50 p-6 gap-4">
              <View className="flex-row items-center gap-2">
                <CheckCircle size={22} color="#16a34a" weight="fill" />
                <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Booking request captured
                </Text>
              </View>
              <Text className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                {buildSummary()}
              </Text>
              <View className="flex-col sm:flex-row gap-3 pt-2">
                <Pressable
                  onPress={continueInApp}
                  className="h-11 px-5 rounded-xl bg-black items-center justify-center flex-row gap-2"
                  accessibilityRole="button"
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Continue tracked repair setup
                  </Text>
                  <ArrowRight size={16} color="#fff" weight="bold" />
                </Pressable>
                <Pressable
                  onPress={openWhatsApp}
                  className="h-11 px-5 rounded-xl border border-slate-200 bg-white items-center justify-center"
                  accessibilityRole="button"
                >
                  <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Send via WhatsApp
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <View className="mt-10 pt-8 border-t border-slate-100">
            <Text className="text-sm text-slate-500 mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
              Directional contractor pricing (Lagos)
            </Text>
            <View className="gap-2">
              {REPAIR_PRICING_GUIDE.slice(0, 3).map((item) => (
                <Text key={item.service} className="text-sm text-slate-600" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {item.service}: {formatNgn(item.lowNgn)} – {formatNgn(item.highNgn)} ({item.unit})
                </Text>
              ))}
            </View>
            <Link href={'/pricing/repairs' as any} asChild>
              <Pressable className="mt-4 self-start" accessibilityRole="link">
                <Text className="text-sm text-black underline" style={{ fontFamily: 'Poppins_500Medium' }}>
                  View full repair pricing guide
                </Text>
              </Pressable>
            </Link>
          </View>
        </WebLandmark>

        <WebLandmark tag="footer" className="border-t border-slate-100 py-8 px-5 md:px-8">
          <View className="max-w-3xl w-full self-center">
            <Text className="text-xs text-slate-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
              {BUILDMYHOUSE_CONTACT.address} · {BUILDMYHOUSE_CONTACT.phoneDisplay}
            </Text>
          </View>
        </WebLandmark>
      </ScrollView>
    </View>
  );
}

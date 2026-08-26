import { useState } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { cardShadowStyle } from '@/lib/card-styles';
import { api } from '@/lib/api';
import { trackWebEvent } from '@/lib/analytics';
import { LAND_VERIFICATION_GUIDE_PATH } from '@/lib/land-verification-in-nigeria-guide-content';

export const LAND_CHECKER_WAITLIST_PRODUCT_KEY = 'land-verification-checker';
export const LAND_CHECKER_WAITLIST_ANCHOR_ID = 'land-checker-waitlist';

type Props = {
  title: string;
  description: string;
  secondaryCta?: { label: string; href: string };
};

function scrollToWaitlistForm() {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.getElementById(LAND_CHECKER_WAITLIST_ANCHOR_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

export function scrollToLandCheckerWaitlist() {
  scrollToWaitlistForm();
}

export default function LandCheckerWaitlistForm({ title, description, secondaryCta }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setStatus('error');
      setMessage('Enter a valid email address.');
      return;
    }

    setStatus('submitting');
    setMessage('');
    trackWebEvent('land_verification_waitlist_submit_attempt', {
      product_key: LAND_CHECKER_WAITLIST_PRODUCT_KEY,
    });

    try {
      const result = await api.post('/waitlist/join', {
        productKey: LAND_CHECKER_WAITLIST_PRODUCT_KEY,
        email: trimmedEmail,
        fullName: fullName.trim() || undefined,
        sourcePath: LAND_VERIFICATION_GUIDE_PATH,
      });

      setStatus('success');
      setMessage(
        result?.message ||
          'You are on the waitlist. We will email you when the Land Verification Checker launches.',
      );
      trackWebEvent('land_verification_waitlist_submit_success', {
        product_key: LAND_CHECKER_WAITLIST_PRODUCT_KEY,
        already_joined: Boolean(result?.alreadyJoined),
      });
      setEmail('');
      setFullName('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not join the waitlist. Please try again.');
      trackWebEvent('land_verification_waitlist_submit_error', {
        product_key: LAND_CHECKER_WAITLIST_PRODUCT_KEY,
      });
    }
  };

  return (
    <View
      nativeID={LAND_CHECKER_WAITLIST_ANCHOR_ID}
      style={cardShadowStyle}
      className="bg-black rounded-3xl p-6"
      {...(Platform.OS === 'web' ? ({ id: LAND_CHECKER_WAITLIST_ANCHOR_ID } as object) : null)}
    >
      <SeoHeading level={2} className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </SeoHeading>
      <Text className="text-white/85 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        {description}
      </Text>

      {status === 'success' ? (
        <View className="rounded-2xl bg-white/10 border border-white/20 p-4 mb-4">
          <Text className="text-white text-sm leading-6" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {message}
          </Text>
        </View>
      ) : (
        <View className="gap-3 mb-4">
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name (optional)"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            className="rounded-2xl bg-white px-4 py-3 text-gray-900 text-sm"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className="rounded-2xl bg-white px-4 py-3 text-gray-900 text-sm"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          {status === 'error' && message ? (
            <Text className="text-red-300 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
              {message}
            </Text>
          ) : null}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={status === 'submitting'}
            className="rounded-full bg-white px-5 py-3"
          >
            {status === 'submitting' ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                Join the Waiting List
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {secondaryCta ? (
        <TouchableOpacity
          onPress={() => router.push(secondaryCta.href as any)}
          className="rounded-full border border-white/40 px-5 py-3"
        >
          <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {secondaryCta.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { requireAuthToContinue } from '@/lib/require-auth-to-continue';
import { useWebSeo } from '@/lib/seo';
import {
  acceptVendorClaim,
  previewVendorClaim,
  type VendorClaimPreview,
} from '@/lib/vendor-manage';

type Step = 'loading' | 'ready' | 'claiming' | 'done' | 'error';

export default function VendorClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(
    () => (Array.isArray(params.token) ? params.token[0] : params.token)?.trim() || '',
    [params.token],
  );

  const [step, setStep] = useState<Step>('loading');
  const [preview, setPreview] = useState<VendorClaimPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useWebSeo({
    title: 'Claim vendor profile | BuildMyHouse',
    description: 'Accept your BuildMyHouse vendor profile invitation.',
    canonicalPath: token ? `/vendors/claim/${token}` : '/vendors/claim',
    robots: 'noindex,nofollow',
  });

  useEffect(() => {
    if (!token) {
      setError('This claim link is missing or invalid.');
      setStep('error');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await previewVendorClaim(token);
        if (cancelled) return;
        setPreview(data);
        setStep('ready');
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Unable to load this claim invite.');
        setStep('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleClaim = async () => {
    if (!token) return;

    const canContinue = await requireAuthToContinue({
      router,
      currentUser,
      userLoading,
      destinationPath: `/vendors/claim/${token}`,
      promptTitle: 'Sign in to claim',
      promptMessage:
        'Sign in or create an account to link this vendor profile to your BuildMyHouse login.',
    });
    if (!canContinue) return;

    setError(null);
    setStep('claiming');
    try {
      await acceptVendorClaim(token);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setStep('done');
    } catch (e: any) {
      setError(e?.message || 'Unable to claim this profile right now.');
      setStep('ready');
    }
  };

  return (
    <SeoContentShell>
      <SeoContentColumn>
        <SeoContentBackButton fallbackHref="/vendors" />

        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          Claim your vendor profile
        </SeoHeading>
        <Text className="text-base mb-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          Linking this invite connects the business listing to your BuildMyHouse account so you can
          keep public details up to date.
        </Text>

        {step === 'loading' || userLoading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color={LANDING_INK} />
          </View>
        ) : null}

        {step === 'error' ? (
          <View className="border rounded-2xl p-4" style={{ borderColor: LANDING_BORDER }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
              {error || 'This invite cannot be used.'}
            </Text>
            <Link href={'/vendors/apply' as any} asChild>
              <Pressable className="mt-4">
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                  Apply to list your business →
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {(step === 'ready' || step === 'claiming') && preview ? (
          <View className="border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
            <Text className="text-xl mb-1" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
              {preview.tradingName}
            </Text>
            <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              Public profile: /vendors/{preview.slug}
              {preview.email ? `\nInvite sent to ${preview.email}` : ''}
              {`\nExpires ${new Date(preview.expiresAt).toLocaleString()}`}
            </Text>

            {error ? (
              <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium', color: '#B91C1C' }}>
                {error}
              </Text>
            ) : null}

            <Pressable
              onPress={handleClaim}
              disabled={step === 'claiming'}
              className="rounded-full bg-black px-5 py-3 items-center"
              accessibilityRole="button"
            >
              {step === 'claiming' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {currentUser ? 'Claim this profile' : 'Sign in and claim'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {step === 'done' ? (
          <View className="border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
            <Text className="text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
              Profile claimed
            </Text>
            <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              You can now update contact details, offerings, and delivery coverage. Sensitive identity
              changes still need BuildMyHouse review.
            </Text>
            <Pressable
              onPress={() => router.replace('/vendors/manage' as any)}
              className="rounded-full bg-black px-5 py-3 items-center"
            >
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Open vendor manage
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SeoContentColumn>
    </SeoContentShell>
  );
}

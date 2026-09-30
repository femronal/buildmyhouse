import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  acceptProfessionalClaim,
  previewProfessionalClaim,
  type ProfessionalClaimPreview,
} from '@/lib/professional-manage';
import { ownerHomeWithListingWelcome } from '@/lib/listing-welcome';

type Step = 'loading' | 'ready' | 'claiming' | 'done' | 'error';

export default function ProfessionalClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(
    () => (Array.isArray(params.token) ? params.token[0] : params.token)?.trim() || '',
    [params.token],
  );

  const [step, setStep] = useState<Step>('loading');
  const [preview, setPreview] = useState<ProfessionalClaimPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useWebSeo({
    title: 'Claim professional listing | BuildMyHouse',
    description: 'Accept your BuildMyHouse professional listing invitation.',
    canonicalPath: token ? `/professionals/claim/${token}` : '/professionals/claim',
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
        const data = await previewProfessionalClaim(token);
        if (cancelled) return;
        setPreview(data);
        setStep('ready');
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'This claim link is invalid, expired, or already used.');
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
      destinationPath: `/professionals/claim/${token}`,
      promptTitle: 'Sign in to claim',
      promptMessage: 'Sign in or create an account to attach this professional listing to your BuildMyHouse login.',
    });
    if (!canContinue) return;

    setError(null);
    setStep('claiming');
    try {
      await acceptProfessionalClaim(token);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      router.replace(ownerHomeWithListingWelcome('professional') as any);
    } catch (e: any) {
      setError(e?.message || 'Unable to claim this listing right now.');
      setStep('ready');
    }
  };

  return (
    <SeoContentShell>
      <SeoContentColumn>
        <SeoContentBackButton fallbackHref="/professionals" />

        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          Claim your professional listing
        </SeoHeading>
        <Text className="text-base mb-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          This invite attaches the listing to your account so you can update public details and upload
          licence documents. Claiming is not verification.
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
            <Text className="mt-3 text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              Ask BuildMyHouse to send a new invite. This link does not claim a listing.
            </Text>
          </View>
        ) : null}

        {(step === 'ready' || step === 'claiming') && preview ? (
          <View className="border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
            <Text className="text-xl mb-1" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
              {preview.displayName}
            </Text>
            <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              Public profile: /professionals/{preview.slug}
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
                  {currentUser ? 'Claim this listing' : 'Sign in and claim'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {step === 'done' ? (
          <View className="border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
            <Text className="text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
              Listing claimed
            </Text>
            <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              You can update the public profile and upload private licence documents. Credential checked,
              BMH Verified, Used by BMH, and Listed stay with BuildMyHouse.
            </Text>
            <Pressable
              onPress={() => router.replace('/professionals/manage' as any)}
              className="rounded-full bg-black px-5 py-3 items-center"
            >
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Open listing manage
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SeoContentColumn>
    </SeoContentShell>
  );
}

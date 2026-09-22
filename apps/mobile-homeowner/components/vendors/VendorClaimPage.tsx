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
import { setPostAuthReturnPath } from '@/lib/post-auth-navigation';
import { useWebSeo } from '@/lib/seo';
import {
  acceptVendorClaim,
  previewVendorClaim,
  type VendorClaimPreview,
} from '@/lib/vendor-manage';
import { buildAuthContinueHref, vendorClaimPath } from '@/lib/vendor-claim-flow';

type Step = 'loading' | 'ready' | 'claiming' | 'done' | 'already' | 'error';

export default function VendorClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(
    () => (Array.isArray(params.token) ? params.token[0] : params.token)?.trim() || '',
    [params.token],
  );
  const destinationPath = token ? vendorClaimPath(token) : '/vendors/claim';

  const [step, setStep] = useState<Step>('loading');
  const [preview, setPreview] = useState<VendorClaimPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useWebSeo({
    title: 'Claim vendor profile | BuildMyHouse',
    description: 'Accept your BuildMyHouse vendor profile invitation.',
    canonicalPath: token ? destinationPath : '/vendors/claim',
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
        setStep(data.alreadyClaimedByYou ? 'already' : 'ready');
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

  const goToAuth = async (mode: 'signup' | 'signin') => {
    await setPostAuthReturnPath(destinationPath);
    router.push(buildAuthContinueHref(destinationPath, mode) as any);
  };

  const handleClaim = async () => {
    if (!token || userLoading) return;
    if (!currentUser) {
      await goToAuth('signup');
      return;
    }

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
          Use this invite to link the listing to a BuildMyHouse login. Claiming is not automatic listing
          approval, and it does not make the business BuildMyHouse Verified.
        </Text>

        {step === 'loading' || userLoading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color={LANDING_INK} />
          </View>
        ) : null}

        {!userLoading && step === 'error' ? (
          <View className="border rounded-2xl p-4" style={{ borderColor: LANDING_BORDER }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
              {error || 'This invite cannot be used.'}
            </Text>
            <Text className="text-sm mt-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              If BuildMyHouse already created this profile, ask us to send a fresh claim invite. Do not
              submit a second “List your business” form — that creates a new application instead of
              claiming this one.
            </Text>
            <Link href={'/vendors/claim' as any} asChild>
              <Pressable className="mt-4">
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                  How claiming works →
                </Text>
              </Pressable>
            </Link>
            <Link href={'/vendors/manage' as any} asChild>
              <Pressable className="mt-3">
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                  Manage listing if you already claimed →
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {!userLoading && (step === 'ready' || step === 'claiming') && preview ? (
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

            {currentUser ? (
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
                    Claim this profile
                  </Text>
                )}
              </Pressable>
            ) : (
              <View>
                <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                  Create a free account (or sign in) to finish claiming. You will come back to this page
                  automatically.
                </Text>
                <Pressable
                  onPress={() => void goToAuth('signup')}
                  className="rounded-full bg-black px-5 py-3 items-center mb-3"
                  accessibilityRole="button"
                >
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Create account to claim
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void goToAuth('signin')}
                  className="rounded-full border px-5 py-3 items-center"
                  style={{ borderColor: LANDING_BORDER }}
                  accessibilityRole="button"
                >
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                    I already have an account
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        {!userLoading && step === 'already' && preview ? (
          <View className="border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
            <Text className="text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
              This profile is already linked to your account
            </Text>
            <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              {preview.tradingName} is connected to this login. Verification is a separate BuildMyHouse
              review step.
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

        {!userLoading && step === 'done' ? (
          <View className="border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
            <Text className="text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
              Profile claimed
            </Text>
            <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              You can now update contact details, offerings, and delivery coverage. Sensitive identity
              changes still need BuildMyHouse review. Claiming does not stamp the listing as Verified.
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

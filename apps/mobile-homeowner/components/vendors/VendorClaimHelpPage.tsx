import { Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { useWebSeo } from '@/lib/seo';

export default function VendorClaimHelpPage() {
  useWebSeo({
    title: 'Claim your vendor listing | BuildMyHouse',
    description:
      'If BuildMyHouse already listed your business, use the claim invite we emailed you. Listing yourself again creates a new application.',
    canonicalPath: '/vendors/claim',
    robots: 'noindex,nofollow',
  });

  return (
    <SeoContentShell>
      <SeoContentColumn>
        <SeoContentBackButton fallbackHref="/vendors" />
        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          Claim a listing BuildMyHouse already created
        </SeoHeading>
        <Text className="text-base mb-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          Public vendor pages do not have a one-click claim button. If we already added your business,
          we send a private invite link to the email on the profile. That link is the only way to attach
          the listing to your login.
        </Text>

        <View className="border rounded-2xl p-5 mb-4" style={{ borderColor: LANDING_BORDER }}>
          <Text className="text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
            If you received a claim email
          </Text>
          <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Open the “Claim profile” link. Create a free account or sign in, then tap Claim this
            profile. You will be returned to the invite automatically. Claiming is not verification.
          </Text>
          <Link href={'/vendors/manage' as any} asChild>
            <Pressable className="rounded-full bg-black px-5 py-3 items-center">
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Manage listing after claiming
              </Text>
            </Pressable>
          </Link>
        </View>

        <View className="border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
          <Text className="text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
            If you have not received an invite
          </Text>
          <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Message BuildMyHouse and ask us to send a claim invite. Do not fill “List your business”
            for a company that is already on the directory — that submits a second application instead
            of claiming the existing profile.
          </Text>
          <Link href={'/vendors/apply' as any} asChild>
            <Pressable
              className="rounded-full border px-5 py-3 items-center"
              style={{ borderColor: LANDING_BORDER }}
            >
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                List a new business instead
              </Text>
            </Pressable>
          </Link>
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}

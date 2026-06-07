import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ArrowRight, ShieldCheck } from 'phosphor-react-native';
import AudienceTabs from '@/components/landing/AudienceTabs';
import HeroHeadline from '@/components/landing/HeroHeadline';
import {
  HERO_SUBHEADLINE,
  LANDING_BORDER,
  LANDING_INK,
  LANDING_MUTED,
  LANDING_SURFACE,
  type AudienceTab,
} from '@/lib/home-landing-content';

type HeroSectionProps = {
  selectedAudience: AudienceTab['key'];
  onSelectAudience: (key: AudienceTab['key']) => void;
  isDesktop: boolean;
};

function DashboardMockup() {
  return (
    <View className="rounded-3xl border bg-white p-5" style={{ borderColor: LANDING_BORDER }}>
      <View className="mb-4 pb-3 border-b" style={{ borderColor: LANDING_BORDER }}>
        <Text className="text-xs uppercase mb-1" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_MUTED }}>
          Active project
        </Text>
        <Text className="text-lg" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          Roof Leak Repair
        </Text>
        <Text className="text-sm mt-1" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
          Status: Inspection Scheduled
        </Text>
      </View>

      <View className="mb-3">
        {[
          'Verified Repairer Assigned',
          'Evidence Required Before Payment',
          'Stage 1: Diagnosis',
          'Stage 2: Materials',
          'Stage 3: Repair',
          'Stage 4: Homeowner Approval',
        ].map((line) => (
          <View key={line} className="flex-row items-center mb-2">
            <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: LANDING_INK }} />
            <Text className="text-sm" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
              {line}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap mt-2">
        {['Verified Worker', 'Stage Evidence', 'Progress Update', 'Payment Approval', 'Chat'].map((tag) => (
          <View
            key={tag}
            className="rounded-full px-3 py-1 mr-2 mb-2 border"
            style={{ borderColor: LANDING_BORDER, backgroundColor: LANDING_SURFACE }}
          >
            <Text className="text-xs" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HeroSection({ selectedAudience, onSelectAudience, isDesktop }: HeroSectionProps) {
  return (
    <View className={isDesktop ? 'flex-row items-start' : ''}>
      <View className={isDesktop ? 'w-[52%] pr-8' : ''}>
        <HeroHeadline compact={!isDesktop} />

        <Text className="text-base leading-7 mt-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          {HERO_SUBHEADLINE}
        </Text>

        <View className="flex-row flex-wrap items-center mt-6">
          <Link href={'/location?mode=explore' as any} asChild>
            <Pressable
              className="rounded-full px-6 py-3.5 mr-3 mb-3"
              style={{ backgroundColor: LANDING_INK }}
              accessibilityRole="link"
            >
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                Hire a Verified Worker
              </Text>
            </Pressable>
          </Link>
          <Link href={'/for-contractors' as any} asChild>
            <Pressable
              className="rounded-full px-6 py-3.5 mr-3 mb-3 border"
              style={{ borderColor: LANDING_BORDER }}
              accessibilityRole="link"
            >
              <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                Get Hired on BuildMyHouse
              </Text>
            </Pressable>
          </Link>
        </View>

        <Link href={'/diaspora/build-in-nigeria-from-abroad' as any} asChild>
          <Pressable className="flex-row items-center mb-2" accessibilityRole="link">
            <ShieldCheck size={16} color={LANDING_INK} weight="fill" />
            <Text className="text-sm mx-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
              Managing from abroad? Start a tracked project
            </Text>
            <ArrowRight size={15} color={LANDING_INK} weight="bold" />
          </Pressable>
        </Link>

        <AudienceTabs selectedKey={selectedAudience} onSelect={onSelectAudience} />
      </View>

      <View className={isDesktop ? 'w-[48%] mt-0' : 'mt-8'}>
        <DashboardMockup />
      </View>
    </View>
  );
}

import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ServiceExperienceContent } from '@/lib/service-experience-content';
import { buildServiceExperienceJsonLd } from '@/lib/service-experience-seo';
import { useWebSeo } from '@/lib/seo';
import ServiceExperienceSeoHead from '@/components/service-experience/ServiceExperienceSeoHead';

type ServiceExperiencePageProps = {
  content: ServiceExperienceContent;
};

export default function ServiceExperiencePage({ content }: ServiceExperiencePageProps) {
  const jsonLd = buildServiceExperienceJsonLd(content);

  useWebSeo({
    title: content.metaTitle,
    description: content.summary,
    canonicalPath: content.canonicalPath,
    robots: 'index,follow',
    jsonLd,
    ogImage: content.images.heroMain,
  });

  return (
    <>
      <ServiceExperienceSeoHead content={content} jsonLd={jsonLd} />
      <ScrollView className="flex-1" style={{ backgroundColor: '#060706' }} contentContainerStyle={{ paddingBottom: 48 }}>
      <View className="px-5 pt-14 pb-8">
        <Text className="text-[11px] uppercase tracking-widest mb-3" style={{ color: 'rgba(243,240,232,.54)', fontFamily: 'Poppins_700Bold' }}>
          Verified {content.headline} · {content.locationLabel}
        </Text>
        <Text className="text-4xl text-[#f3f0e8] mb-4" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
          {content.headline}
        </Text>
        <Text className="text-base leading-7 mb-6" style={{ color: 'rgba(243,240,232,.76)', fontFamily: 'Poppins_400Regular' }}>
          {content.heroLead}
        </Text>
        <Image source={{ uri: content.images.heroMain }} style={{ width: '100%', height: 240, borderRadius: 20, marginBottom: 24 }} contentFit="cover" />
        <View className="flex-row flex-wrap gap-3 mb-8">
          <Link href={content.primaryCta.href as any} asChild>
            <Pressable className="rounded-full px-5 py-3" style={{ backgroundColor: '#22c55e' }}>
              <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: '#060706' }}>{content.primaryCta.label}</Text>
            </Pressable>
          </Link>
          <Link href={content.secondaryCta.href as any} asChild>
            <Pressable className="rounded-full px-5 py-3 border" style={{ borderColor: 'rgba(243,240,232,.12)' }}>
              <Text className="text-sm text-[#f3f0e8]" style={{ fontFamily: 'Poppins_700Bold' }}>{content.secondaryCta.label}</Text>
            </Pressable>
          </Link>
        </View>

        {content.pillars.map((pillar, index) => (
          <View key={pillar.title} className="rounded-[28px] border p-5 mb-3" style={{ borderColor: 'rgba(243,240,232,.1)', backgroundColor: 'rgba(255,255,255,.035)' }}>
            <Text className="text-xs mb-3" style={{ color: 'rgba(243,240,232,.44)', fontFamily: 'Poppins_700Bold' }}>{String(index + 1).padStart(2, '0')}</Text>
            <Text className="text-xl text-[#f3f0e8] mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>{pillar.title}</Text>
            <Text className="text-sm leading-6" style={{ color: 'rgba(243,240,232,.54)', fontFamily: 'Poppins_400Regular' }}>{pillar.body}</Text>
          </View>
        ))}

        {content.reviews.map((review) => (
          <View key={review.quote} className="rounded-[28px] border p-5 mb-3" style={{ borderColor: 'rgba(243,240,232,.1)', backgroundColor: 'rgba(255,255,255,.035)' }}>
            <Text className="text-base leading-7 text-[#f3f0e8] mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>&ldquo;{review.quote}&rdquo;</Text>
            <Text className="text-sm" style={{ color: 'rgba(243,240,232,.72)', fontFamily: 'Poppins_600SemiBold' }}>{review.name}</Text>
          </View>
        ))}

        {content.faqs.map((faq) => (
          <View key={faq.question} className="border-t pt-5 mt-2" style={{ borderColor: 'rgba(243,240,232,.1)' }}>
            <Text className="text-lg text-[#f3f0e8] mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>{faq.question}</Text>
            <Text className="text-sm leading-6" style={{ color: 'rgba(243,240,232,.56)', fontFamily: 'Poppins_400Regular' }}>{faq.answer}</Text>
          </View>
        ))}

        <Text className="text-[11px] uppercase tracking-widest mt-10 mb-3" style={{ color: 'rgba(243,240,232,.54)', fontFamily: 'Poppins_700Bold' }}>Guides</Text>
        {content.articleLinks.map((link) => (
          <Link key={link.href} href={link.href as any} asChild>
            <Pressable className="py-2">
              <Text className="text-sm" style={{ color: 'rgba(243,240,232,.72)', fontFamily: 'Poppins_600SemiBold' }}>{link.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
    </>
  );
}

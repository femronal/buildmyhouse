import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock3 } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { articles as fallbackArticles, fetchPublishedArticles, type Article } from '@/lib/articles';
import { useWebSeo } from '@/lib/seo';
import { cardShadowStyle } from '@/lib/card-styles';

export default function ArticlesIndexPage() {
  const router = useRouter();
  const [remoteArticles, setRemoteArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublishedArticles()
      .then((items) => {
        if (!active) return;
        if (items.length > 0) {
          setRemoteArticles(items);
        }
      })
      .catch(() => {
        // Keep static fallback articles when API is unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  const list = remoteArticles && remoteArticles.length > 0 ? remoteArticles : fallbackArticles;

  useWebSeo({
    title: 'BuildMyHouse Articles | Construction, Renovation, Diaspora Guides',
    description:
      'Read practical BuildMyHouse articles on construction, renovation, interior design, and diaspora project execution in Nigeria.',
    canonicalPath: '/articles',
    robots: 'index,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'BuildMyHouse Articles',
      description:
        'Educational resources for Nigerian homeowners and diaspora clients covering construction, renovation, and interior design.',
      url: `${(process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '')}/articles`,
    },
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-10 px-5 pb-2 md:pt-14 md:px-6 md:pb-4">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/login'))}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-2 md:mb-4 md:w-10 md:h-10"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text
            className="text-[10px] md:text-xs uppercase tracking-wide text-blue-700 mb-1 md:mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            BuildMyHouse Resources
          </Text>
          <SeoHeading
            level={1}
            className="text-xl leading-snug text-black mb-1.5 md:text-3xl md:leading-tight md:mb-2"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Articles and Guides
          </SeoHeading>
          <Text
            className="text-gray-600 text-xs leading-5 md:text-sm md:leading-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Persuasive and practical guides to help you plan, fund, and execute better projects in Nigeria.
          </Text>
        </View>

        <View className="px-5 md:px-6">
          {list.map((article) => (
            <TouchableOpacity
              key={article.slug}
              style={cardShadowStyle}
              className="border border-gray-200 rounded-3xl mb-5 bg-white"
              onPress={() => router.push(`/articles/${article.slug}` as any)}
            >
              <View className="overflow-hidden rounded-3xl">
              <Image
                source={{ uri: article.coverImageUrl }}
                accessibilityLabel={article.coverImageAlt}
                className="w-full h-44"
                resizeMode="cover"
              />
              <View className="p-4">
                <Text className="text-xs text-blue-700 uppercase mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {article.tags[0]}
                </Text>
                <Text className="text-black text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {article.title}
                </Text>
                <Text className="text-gray-600 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {article.excerpt}
                </Text>
                <View className="flex-row items-center">
                  <Clock3 size={14} color="#6b7280" />
                  <Text className="text-gray-500 text-xs ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {article.readingMinutes} min read
                  </Text>
                </View>
              </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

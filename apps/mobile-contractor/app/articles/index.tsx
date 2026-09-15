import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock3 } from 'lucide-react-native';
import GcPillarCoverImage from '@/components/articles/GcPillarCoverImage';
import { cardShadowStyle } from '@/lib/card-styles';
import { fetchPublishedArticles, type Article } from '@/lib/articles';
import {
  GC_ARTICLES_INDEX_SEO,
  GC_PILLAR_PATH,
  GC_PILLAR_SLUG,
  gcPillarCluster,
  gcPillarSeo,
  getLocalGcPillarListing,
} from '@/lib/gc-pillar-article';
import { useWebSeo } from '@/lib/seo';

export default function GCArticlesIndexPage() {
  const router = useRouter();
  const pillar = getLocalGcPillarListing();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useWebSeo({
    title: GC_ARTICLES_INDEX_SEO.title,
    description: GC_ARTICLES_INDEX_SEO.description,
    canonicalPath: GC_ARTICLES_INDEX_SEO.canonicalPath,
    ogImage: gcPillarSeo.ogImage,
  });

  useEffect(() => {
    let active = true;
    fetchPublishedArticles()
      .then((items) => {
        if (!active) return;
        setArticles(items.filter((item) => item.slug !== GC_PILLAR_SLUG));
      })
      .catch(() => {
        if (!active) return;
        setArticles([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-10 px-5 pb-2 md:pt-14 md:px-6 md:pb-4">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as any))}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-2 md:mb-4 md:w-10 md:h-10"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-[10px] md:text-xs uppercase tracking-wide text-blue-700 mb-1 md:mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            BuildMyHouse GC Resources
          </Text>
          <Text className="text-2xl text-black mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Articles for General Contractors
          </Text>
          <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            If you are a general contractor, read the first article below. The articles after it give extra knowledge on winning clients, mobilisation, documentation and variations.
          </Text>
        </View>

        <View className="px-5 md:px-6">
          <TouchableOpacity
            style={cardShadowStyle}
            className="border border-blue-200 rounded-3xl mb-5 bg-white"
            onPress={() => router.push(GC_PILLAR_PATH as any)}
            accessibilityRole="link"
          >
            <View className="overflow-hidden rounded-3xl">
              <GcPillarCoverImage height={176} />
              <View className="p-4">
                <Text className="text-xs text-blue-700 uppercase mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Read this first
                </Text>
                <Text className="text-black text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {pillar.title}
                </Text>
                <Text className="text-gray-600 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {pillar.excerpt}
                </Text>
                <View className="flex-row items-center">
                  <Clock3 size={14} color="#6b7280" />
                  <Text className="text-gray-500 text-xs ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {pillar.readingMinutes} min read
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <Text className="text-black text-lg mb-2 mt-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Supporting articles
          </Text>
          <Text className="text-gray-600 text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            After you have read the first article, these guides will give extra knowledge. They are not published yet.
          </Text>
          {gcPillarCluster.map((item) => (
            <View key={item.slug} className="border border-gray-200 rounded-2xl mb-3 bg-white p-4">
              <Text className="text-[10px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Coming soon
              </Text>
              <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {item.title}
              </Text>
              <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item.description}
              </Text>
            </View>
          ))}

          <Text className="text-black text-lg mb-3 mt-6" style={{ fontFamily: 'Poppins_700Bold' }}>
            Other published articles
          </Text>
          {isLoading ? (
            <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
              Loading published articles...
            </Text>
          ) : articles.length === 0 ? (
            <Text className="text-gray-500 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              No other articles have been published yet.
            </Text>
          ) : (
            articles.map((article) => (
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
                      {article.tags[0] || 'gc'}
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
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

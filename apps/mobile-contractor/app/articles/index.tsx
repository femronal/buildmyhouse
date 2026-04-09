import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock3 } from 'lucide-react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { fetchPublishedArticles, type Article } from '@/lib/articles';

export default function GCArticlesIndexPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublishedArticles()
      .then((items) => {
        if (!active) return;
        setArticles(items);
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
            onPress={() => router.replace('/contractor/gc-dashboard')}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-2 md:mb-4 md:w-10 md:h-10"
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
            Insights on project delivery, client trust, and structured execution for professional GCs.
          </Text>
        </View>

        <View className="px-5 md:px-6">
          {isLoading ? (
            <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
              Loading articles...
            </Text>
          ) : articles.length === 0 ? (
            <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
              No GC articles published yet.
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

import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import SeoArticlePage from '@/components/seo/SeoArticlePage';
import {
  fetchPublishedArticleBySlug,
  getAllArticleSlugs,
  getArticleBySlug,
  getArticleSchema,
  type Article,
} from '@/lib/articles';
import { useWebSeo } from '@/lib/seo';

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

export default function ArticleDetailPage() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const localArticle = getArticleBySlug(slug);
  const [remoteArticle, setRemoteArticle] = useState<Article | null>(null);
  const [lookupComplete, setLookupComplete] = useState(false);

  useEffect(() => {
    let active = true;
    if (!slug) {
      setLookupComplete(true);
      return;
    }

    if (localArticle) {
      setLookupComplete(true);
      return;
    }

    fetchPublishedArticleBySlug(slug)
      .then((item) => {
        if (!active) return;
        setRemoteArticle(item || null);
        setLookupComplete(true);
      })
      .catch(() => {
        if (!active) return;
        setLookupComplete(true);
      });

    return () => {
      active = false;
    };
  }, [slug, localArticle]);

  const article = useMemo(() => localArticle || remoteArticle, [localArticle, remoteArticle]);

  useWebSeo({
    title: article?.title || 'BuildMyHouse Article',
    description: article?.description || 'BuildMyHouse educational content for homeowners and diaspora users.',
    canonicalPath: article?.canonicalPath || '/articles',
    robots: article ? 'index,follow' : 'noindex,nofollow',
    jsonLd: article ? getArticleSchema(article) : undefined,
  });

  if (!article && !lookupComplete) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-gray-600 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading article...
        </Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
          Article not found
        </Text>
        <Text className="text-gray-600 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
          This article link may be outdated. Please return to the articles page.
        </Text>
      </View>
    );
  }

  return <SeoArticlePage article={article} />;
}

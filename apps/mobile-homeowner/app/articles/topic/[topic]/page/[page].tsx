import { useLocalSearchParams } from 'expo-router';
import ArticlesHub from '@/components/articles/ArticlesHub';
import { BLOG_TOPICS } from '@/lib/articles-hub';

export function generateStaticParams() {
  return BLOG_TOPICS.flatMap((topic) =>
    [2, 3].map((page) => ({ topic: topic.slug, page: String(page) })),
  );
}

export default function ArticlesTopicPageNumber() {
  const params = useLocalSearchParams<{ topic?: string | string[]; page?: string | string[] }>();
  const topic = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  return <ArticlesHub topicSlug={topic} page={Math.max(1, Number(raw) || 1)} />;
}

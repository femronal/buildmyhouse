import { useLocalSearchParams } from 'expo-router';
import ArticlesHub from '@/components/articles/ArticlesHub';
import { BLOG_TOPICS } from '@/lib/articles-hub';

export function generateStaticParams() {
  return BLOG_TOPICS.map((topic) => ({ topic: topic.slug }));
}

export default function ArticlesTopicPage() {
  const params = useLocalSearchParams<{ topic?: string | string[] }>();
  const topic = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  return <ArticlesHub topicSlug={topic} />;
}

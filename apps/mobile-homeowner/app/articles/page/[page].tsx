import { useLocalSearchParams } from 'expo-router';
import ArticlesHub from '@/components/articles/ArticlesHub';

export function generateStaticParams() {
  return [2, 3, 4, 5].map((page) => ({ page: String(page) }));
}

export default function ArticlesPageNumber() {
  const params = useLocalSearchParams<{ page?: string | string[] }>();
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number(raw) || 1);
  return <ArticlesHub page={page} />;
}

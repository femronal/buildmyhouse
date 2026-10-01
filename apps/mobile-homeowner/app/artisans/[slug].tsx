import { useLocalSearchParams } from 'expo-router';
import ArtisanProfilePage from '@/components/artisans/ArtisanProfilePage';

export default function ArtisanSlugRoute() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const raw = params.slug;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  return <ArtisanProfilePage slug={slug ? String(slug) : '__missing__'} />;
}

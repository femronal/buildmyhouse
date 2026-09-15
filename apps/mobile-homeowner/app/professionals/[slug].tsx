import { useLocalSearchParams } from 'expo-router';
import ProfessionalProfilePage from '@/components/professionals/ProfessionalProfilePage';

export default function ProfessionalSlugRoute() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const raw = params.slug;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  return <ProfessionalProfilePage slug={slug ? String(slug) : '__missing__'} />;
}

import { useLocalSearchParams } from 'expo-router';
import ContractorDirectoryPage from '@/components/contractors/ContractorDirectoryPage';
import {
  CONTRACTOR_DIRECTORY_SPECIALTY_SLUGS,
  isContractorDirectorySpecialtySlug,
} from '@/lib/public-contractors';

export function generateStaticParams() {
  return CONTRACTOR_DIRECTORY_SPECIALTY_SLUGS.map((specialty) => ({ specialty }));
}

export default function LagosContractorSpecialtyPage() {
  const params = useLocalSearchParams<{ specialty?: string }>();
  const specialty = typeof params.specialty === 'string' ? params.specialty : '';

  if (!isContractorDirectorySpecialtySlug(specialty)) {
    return <ContractorDirectoryPage />;
  }

  return <ContractorDirectoryPage specialty={specialty} />;
}

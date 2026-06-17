import { useLocalSearchParams } from 'expo-router';
import ContractorDirectoryPage from '@/components/contractors/ContractorDirectoryPage';
import { isContractorDirectorySpecialtySlug } from '@/lib/public-contractors';

export default function LagosContractorSpecialtyPage() {
  const params = useLocalSearchParams<{ specialty?: string }>();
  const specialty = typeof params.specialty === 'string' ? params.specialty : '';

  if (!isContractorDirectorySpecialtySlug(specialty)) {
    return <ContractorDirectoryPage />;
  }

  return <ContractorDirectoryPage specialty={specialty} />;
}

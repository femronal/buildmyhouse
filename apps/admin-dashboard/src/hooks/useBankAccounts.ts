import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountOwnerName: string;
  isDefault: boolean;
};

export function useBankAccounts(userId: string | null) {
  return useQuery({
    queryKey: ['admin-bank-accounts', userId],
    queryFn: () => api.get<BankAccount[]>(`/contractors/admin/${userId}/bank-accounts`),
    enabled: !!userId,
    staleTime: 0,
  });
}

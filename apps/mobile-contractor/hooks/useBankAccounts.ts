import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BankAccount {
  id: string;
  bankName: string;
  accountOwnerName: string;
  maskedAccountNumber: string;
  isDefault: boolean;
}

export function useBankAccounts() {
  return useQuery<BankAccount[]>({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await api.get('/contractors/bank-accounts');
      return Array.isArray(res) ? res : [];
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { bankName: string; accountNumber: string; accountOwnerName: string; isDefault?: boolean }) =>
      api.post('/contractors/bank-accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

export function useBankAccount(id: string | null) {
  return useQuery({
    queryKey: ['bank-account', id],
    queryFn: () => api.get(`/contractors/bank-accounts/${id}`),
    enabled: !!id,
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { bankName?: string; accountNumber?: string; accountOwnerName?: string } }) =>
      api.patch(`/contractors/bank-accounts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/contractors/bank-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

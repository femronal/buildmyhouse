import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type UpdateCurrentUserInput = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  acceptHomeownerTerms?: boolean;
  acceptGCTerms?: boolean;
  completeProfileSetup?: boolean;
};

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCurrentUserInput) => api.patch('/auth/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
}

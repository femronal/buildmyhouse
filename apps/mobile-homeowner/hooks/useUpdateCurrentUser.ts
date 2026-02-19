import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type UpdateCurrentUserInput = {
  fullName?: string;
  phone?: string;
};

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  pictureUrl?: string | null;
  role: string;
  verified: boolean;
  phone?: string | null;
  createdAt: string;
};

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCurrentUserInput) => api.patch('/auth/me', data),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['currentUser'] });
      const previous = queryClient.getQueryData<CurrentUser>(['currentUser']);
      if (previous) {
        queryClient.setQueryData<CurrentUser>(['currentUser'], {
          ...previous,
          ...updates,
        });
      }
      return { previous };
    },
    onError: (_err, _updates, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['currentUser'], ctx.previous);
      }
    },
    onSuccess: (updatedUser: CurrentUser) => {
      // Ensure cache matches server response
      queryClient.setQueryData(['currentUser'], updatedUser);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}


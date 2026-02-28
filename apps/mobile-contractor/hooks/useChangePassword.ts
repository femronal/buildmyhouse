import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      api.patch('/auth/me/password', data),
  });
}

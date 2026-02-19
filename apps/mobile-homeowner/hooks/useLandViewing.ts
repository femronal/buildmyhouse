import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useScheduleLandViewing() {
  return useMutation({
    mutationFn: (landId: string) => api.post(`/lands/${landId}/schedule-viewing`, {}),
  });
}

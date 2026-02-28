import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRequestRentalInspection() {
  return useMutation({
    mutationFn: (rentalId: string) => api.post(`/rentals/${rentalId}/request-inspection`, {}),
  });
}


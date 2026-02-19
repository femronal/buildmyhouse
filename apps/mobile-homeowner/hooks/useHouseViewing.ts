import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useScheduleHouseViewing() {
  return useMutation({
    mutationFn: (houseId: string) =>
      api.post(`/houses/${houseId}/schedule-viewing`, {}),
  });
}

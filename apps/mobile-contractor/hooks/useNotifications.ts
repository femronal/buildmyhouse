import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  unreadCount: number;
  items: NotificationItem[];
};

const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => api.get<NotificationsResponse>('/notifications/me'),
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'unread'],
    queryFn: () => api.get<{ unreadCount: number }>('/notifications/me/unread-count'),
    retry: false,
    staleTime: 15 * 1000,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/me/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/me/read-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/chatService';

/**
 * Get unread message count for a specific conversation
 */
export function useConversationUnreadCount(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ['conversation-unread-count', conversationId],
    queryFn: async () => {
      if (!conversationId) return 0;
      return chatService.getConversationUnreadCount(conversationId);
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds for unread counts
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Get all conversations with unread counts
 */
export function useUserConversations(enabled = true) {
  return useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      return chatService.getUserConversations();
    },
    enabled,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}



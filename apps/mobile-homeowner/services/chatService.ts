import { api } from '@/lib/api';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface Conversation {
  id: string;
  projectId?: string;
  participants: Array<{
    id: string;
    fullName: string;
    email: string;
    pictureUrl?: string;
  }>;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export const chatService = {
  /**
   * Get or create a conversation between users
   */
  getOrCreateConversation: async (userIds: string[], projectId?: string): Promise<Conversation> => {
    try {
      const response = await api.post('/chat/conversations', {
        userIds,
        projectId,
      });
      return response;
    } catch (error: any) {
      console.error('❌ [chatService] Error getting/creating conversation:', error);
      throw error;
    }
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      return response;
    } catch (error: any) {
      console.error('❌ [chatService] Error getting messages:', error);
      throw error;
    }
  },

  /**
   * Send a message
   */
  sendMessage: async (
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
  ): Promise<Message> => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content,
        type,
      });
      return response;
    } catch (error: any) {
      console.error('❌ [chatService] Error sending message:', error);
      throw error;
    }
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId: string) => {
    try {
      const response = await api.delete(`/chat/conversations/${conversationId}`);
      return response;
    } catch (error: any) {
      console.error('❌ [chatService] Error deleting conversation:', error);
      throw error;
    }
  },

  /**
   * Get all conversations for the current user with unread counts
   */
  getUserConversations: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return Array.isArray(response) ? response : (response.data || []);
    } catch (error: any) {
      console.error('❌ [chatService] Error fetching user conversations:', error);
      throw error;
    }
  },

  /**
   * Get unread message count for a specific conversation
   */
  getConversationUnreadCount: async (conversationId: string) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/unread-count`);
      return response.unreadCount || 0;
    } catch (error: any) {
      console.error('❌ [chatService] Error fetching unread count:', error);
      return 0;
    }
  },

  /**
   * Mark all messages in a conversation as read
   */
  markConversationAsRead: async (conversationId: string) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/mark-read`);
      return response;
    } catch (error: any) {
      console.error('❌ [chatService] Error marking conversation as read:', error);
      throw error;
    }
  },
};


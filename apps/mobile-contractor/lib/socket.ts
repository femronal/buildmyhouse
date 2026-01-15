import { io, Socket } from 'socket.io-client';

const SOCKET_URL = __DEV__ 
  ? 'http://localhost:3001' 
  : 'https://api.buildmyhouse.com';

let socket: Socket | null = null;

/**
 * Initialize WebSocket connection with JWT authentication
 */
export const initSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    if (__DEV__) console.log('✅ WebSocket connected');
  });

  socket.on('disconnect', () => {
    if (__DEV__) console.log('❌ WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a project room to receive real-time updates
 */
export const joinProjectRoom = (projectId: string): void => {
  if (socket?.connected) {
    socket.emit('join:project', { projectId });
  }
};

/**
 * Leave a project room
 */
export const leaveProjectRoom = (projectId: string): void => {
  if (socket?.connected) {
    socket.emit('leave:project', { projectId });
  }
};

/**
 * Join a conversation room for chat
 */
export const joinConversationRoom = (conversationId: string): void => {
  if (socket?.connected) {
    socket.emit('join:conversation', { conversationId });
  }
};

/**
 * Leave a conversation room
 */
export const leaveConversationRoom = (conversationId: string): void => {
  if (socket?.connected) {
    socket.emit('leave:conversation', { conversationId });
  }
};

/**
 * Send a chat message
 */
export const sendMessage = (
  conversationId: string,
  message: { content: string; type?: 'text' | 'image' | 'file' },
): void => {
  if (socket?.connected) {
    socket.emit('message:send', {
      conversationId,
      message: {
        ...message,
        type: message.type || 'text',
      },
    });
  }
};




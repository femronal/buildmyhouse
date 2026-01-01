import { useEffect, useRef, useState, useCallback } from 'react';
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';

interface UseSocketOptions {
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string, type?: 'text' | 'image' | 'file') => void;
  onProjectUpdate: (callback: (data: any) => void) => () => void;
  onStageCompleted: (callback: (data: any) => void) => () => void;
  onNewMessage: (callback: (message: any) => void) => () => void;
  onNotification: (callback: (notification: any) => void) => () => void;
}

export const useSocket = (options: UseSocketOptions): UseSocketReturn => {
  const { token, onConnect, onDisconnect, onError } = options;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    // Initialize socket
    const socket = initSocket(token);
    socketRef.current = socket;

    // Set up event listeners
    const handleConnect = () => {
      setConnected(true);
      onConnect?.();
    };

    const handleDisconnect = () => {
      setConnected(false);
      onDisconnect?.();
    };

    const handleError = (error: any) => {
      onError?.(error);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('connect_error', handleError);

    // Check if already connected
    if (socket.connected) {
      setConnected(true);
      onConnect?.();
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.off('connect_error', handleError);
    };
  }, [token, onConnect, onDisconnect, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        disconnectSocket();
      }
    };
  }, []);

  const joinProject = useCallback((projectId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:project', { projectId });
    }
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:project', { projectId });
    }
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:conversation', { conversationId });
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:conversation', { conversationId });
    }
  }, []);

  const sendMessage = useCallback((
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
  ) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:send', {
        conversationId,
        message: { content, type },
      });
    }
  }, []);

  const onProjectUpdate = useCallback((callback: (data: any) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('project:update', callback);
    return () => {
      socketRef.current?.off('project:update', callback);
    };
  }, []);

  const onStageCompleted = useCallback((callback: (data: any) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('stage:completed', callback);
    return () => {
      socketRef.current?.off('stage:completed', callback);
    };
  }, []);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('message:new', callback);
    return () => {
      socketRef.current?.off('message:new', callback);
    };
  }, []);

  const onNotification = useCallback((callback: (notification: any) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('notification:new', callback);
    return () => {
      socketRef.current?.off('notification:new', callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    joinProject,
    leaveProject,
    joinConversation,
    leaveConversation,
    sendMessage,
    onProjectUpdate,
    onStageCompleted,
    onNewMessage,
    onNotification,
  };
};




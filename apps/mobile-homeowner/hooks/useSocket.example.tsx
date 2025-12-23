/**
 * Example usage of useSocket hook
 * 
 * This demonstrates how to use the WebSocket hook in your components
 */

import React, { useEffect } from 'react';
import { useSocket } from './useSocket';

// Example: Using WebSocket in a Project Details component
export function ProjectDetailsScreen({ projectId, token }: { projectId: string; token: string }) {
  const {
    connected,
    joinProject,
    leaveProject,
    onProjectUpdate,
    onStageCompleted,
    onNotification,
  } = useSocket({
    token,
    onConnect: () => console.log('Connected to WebSocket'),
    onDisconnect: () => console.log('Disconnected from WebSocket'),
    onError: (error) => console.error('WebSocket error:', error),
  });

  // Join project room when component mounts
  useEffect(() => {
    if (connected) {
      joinProject(projectId);
    }

    return () => {
      leaveProject(projectId);
    };
  }, [connected, projectId, joinProject, leaveProject]);

  // Listen for project updates
  useEffect(() => {
    const unsubscribe = onProjectUpdate((data) => {
      console.log('Project updated:', data);
      // Update your local state or refetch data
      // Example: refetchProject();
    });

    return unsubscribe;
  }, [onProjectUpdate]);

  // Listen for stage completions
  useEffect(() => {
    const unsubscribe = onStageCompleted((data) => {
      console.log('Stage completed:', data);
      // Show notification or update UI
    });

    return unsubscribe;
  }, [onStageCompleted]);

  // Listen for notifications
  useEffect(() => {
    const unsubscribe = onNotification((notification) => {
      console.log('New notification:', notification);
      // Show toast or update notification badge
    });

    return unsubscribe;
  }, [onNotification]);

  return (
    <div>
      <p>WebSocket: {connected ? 'Connected' : 'Disconnected'}</p>
      {/* Your project details UI */}
    </div>
  );
}

// Example: Using WebSocket in a Chat component
export function ChatScreen({ conversationId, token }: { conversationId: string; token: string }) {
  const {
    connected,
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
  } = useSocket({
    token,
  });

  const [messages, setMessages] = React.useState<any[]>([]);

  // Join conversation room
  useEffect(() => {
    if (connected) {
      joinConversation(conversationId);
    }

    return () => {
      leaveConversation(conversationId);
    };
  }, [connected, conversationId, joinConversation, leaveConversation]);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    return unsubscribe;
  }, [onNewMessage]);

  const handleSendMessage = (content: string) => {
    sendMessage(conversationId, content);
  };

  return (
    <div>
      {/* Your chat UI */}
      <button onClick={() => handleSendMessage('Hello!')}>
        Send Message
      </button>
    </div>
  );
}



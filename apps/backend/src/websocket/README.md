# WebSocket Real-time Features

This module provides real-time communication using Socket.io for:
- Real-time project updates
- Chat messages
- Stage completion notifications

## Setup

The WebSocket gateway is automatically initialized when the app starts. It listens on the same port as the HTTP server.

## Client Connection

### Connect from React Native/Web Client

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  query: {
    userId: 'user-id-here', // Pass user ID for authentication
  },
  transports: ['websocket'],
});

// Join a project room to receive updates
socket.emit('join:project', { projectId: 'project-id' });

// Listen for project updates
socket.on('project:update', (data) => {
  console.log('Project updated:', data);
});

// Listen for stage completions
socket.on('stage:completed', (data) => {
  console.log('Stage completed:', data);
});

// Join a conversation for chat
socket.emit('join:conversation', { conversationId: 'conv-id' });

// Send a message
socket.emit('message:send', {
  conversationId: 'conv-id',
  message: {
    content: 'Hello!',
    type: 'text',
  },
});

// Listen for new messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});

// Listen for notifications
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

## Server-side Usage

### Emit Events from Other Modules

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly wsService: WebSocketService) {}

  async updateProject(projectId: string, update: any) {
    // Update project in database...
    
    // Emit real-time update
    this.wsService.emitProjectUpdate(projectId, {
      type: 'status_change',
      data: update,
    });
  }

  async completeStage(projectId: string, stage: any) {
    // Update stage in database...
    
    // Emit stage completion notification
    this.wsService.emitStageCompletion(projectId, stage);
  }
}
```

## Events

### Client → Server Events

- `join:project` - Join a project room
- `leave:project` - Leave a project room
- `join:conversation` - Join a conversation room
- `leave:conversation` - Leave a conversation room
- `message:send` - Send a chat message

### Server → Client Events

- `project:update` - Project was updated
- `stage:completed` - Stage was completed
- `message:new` - New chat message received
- `notification:new` - New notification for user

## Authentication

Currently, user authentication is handled via query parameters. In production, you should:
1. Validate JWT tokens in the `handleConnection` method
2. Extract user ID from the token
3. Store authenticated user info with the socket connection



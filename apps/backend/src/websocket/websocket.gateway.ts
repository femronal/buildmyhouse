import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtAuthService, JWTPayload } from '../auth/jwt-auth.service';

@WSGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly socketUserMap = new Map<string, string>(); // socketId -> userId
  private readonly socketPayloadMap = new Map<string, JWTPayload>(); // socketId -> JWT payload

  constructor(private readonly jwtAuthService: JwtAuthService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client attempting connection: ${client.id}`);

    try {
      // Extract token from handshake
      const token = this.jwtAuthService.extractTokenFromHandshake(
        client.handshake.auth,
      ) || (client.handshake.query.token as string);

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided for ${client.id}`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtAuthService.verifyToken(token);
      const userId = payload.sub;

      // Store user connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)?.add(client.id);
      this.socketUserMap.set(client.id, userId);
      this.socketPayloadMap.set(client.id, payload);

      // Attach user info to socket for later use
      (client as any).userId = userId;
      (client as any).userPayload = payload;

      this.logger.log(
        `User ${userId} (${payload.email}) connected with socket ${client.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection rejected for ${client.id}: ${error.message}`,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove socket from connected users
    if (userId) {
      const socketIds = this.connectedUsers.get(userId);
      if (socketIds) {
        socketIds.delete(client.id);
        if (socketIds.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
      this.logger.log(`User ${userId} disconnected socket ${client.id}`);
    }

    // Clean up maps
    this.socketUserMap.delete(client.id);
    this.socketPayloadMap.delete(client.id);
  }

  // Join project room for real-time updates
  @SubscribeMessage('join:project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) {
      return { event: 'error', message: 'Not authenticated' };
    }

    const room = `project:${data.projectId}`;
    client.join(room);
    this.logger.log(`User ${userId} (${client.id}) joined room ${room}`);
    return { event: 'joined:project', room, projectId: data.projectId };
  }

  // Leave project room
  @SubscribeMessage('leave:project')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `project:${data.projectId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { event: 'left:project', room };
  }

  // Join conversation room for chat
  @SubscribeMessage('join:conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined conversation ${room}`);
    return { event: 'joined:conversation', room };
  }

  // Leave conversation room
  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left conversation ${room}`);
    return { event: 'left:conversation', room };
  }

  // Send chat message
  @SubscribeMessage('message:send')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; message: any },
  ) {
    const userId = (client as any).userId;
    if (!userId) {
      return { event: 'error', message: 'Not authenticated' };
    }

    const room = `conversation:${data.conversationId}`;
    // Add sender info to message
    const messageWithSender = {
      ...data.message,
      senderId: userId,
      timestamp: new Date(),
    };
    // Broadcast to all clients in the conversation room (including sender)
    this.server.to(room).emit('message:new', messageWithSender);
    this.logger.log(
      `User ${userId} sent message in conversation ${data.conversationId}`,
    );
    return { event: 'message:sent', success: true };
  }

  // ========== Helper methods for emitting events ==========

  // Emit project update to all clients in project room
  emitProjectUpdate(projectId: string, update: any) {
    const room = `project:${projectId}`;
    this.server.to(room).emit('project:update', {
      projectId,
      update,
      timestamp: new Date(),
    });
    this.logger.log(`Project update emitted to room ${room}`);
  }

  // Emit stage completion notification
  emitStageCompletion(projectId: string, stage: any) {
    const room = `project:${projectId}`;
    this.server.to(room).emit('stage:completed', {
      projectId,
      stage,
      timestamp: new Date(),
    });
    this.logger.log(`Stage completion notification emitted for project ${projectId}`);
  }

  // Emit new chat message
  emitNewMessage(conversationId: string, message: any) {
    const room = `conversation:${conversationId}`;
    this.server.to(room).emit('message:new', message);
    this.logger.log(`New message emitted to conversation ${conversationId}`);
  }

  // Emit notification to specific user
  emitUserNotification(userId: string, notification: any) {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('notification:new', {
          ...notification,
          timestamp: new Date(),
        });
      });
      this.logger.log(`Notification sent to user ${userId}`);
    }
  }

  // Get connected users for a project (optional utility)
  getConnectedUsersForProject(projectId: string): string[] {
    // This would require tracking which users are in which project rooms
    // For now, return all connected users
    return Array.from(this.connectedUsers.keys());
  }
}

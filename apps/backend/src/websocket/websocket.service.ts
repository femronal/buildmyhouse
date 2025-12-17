import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';

/**
 * Service to emit WebSocket events from other modules
 * Inject this service in your modules to send real-time updates
 */
@Injectable()
export class WebSocketService {
  constructor(
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly gateway: WebSocketGateway,
  ) {}

  /**
   * Emit project update to all clients watching the project
   */
  emitProjectUpdate(projectId: string, update: {
    type: 'status_change' | 'budget_update' | 'progress_update' | 'stage_change';
    data: any;
  }) {
    this.gateway.emitProjectUpdate(projectId, update);
  }

  /**
   * Emit stage completion notification
   */
  emitStageCompletion(projectId: string, stage: {
    id: string;
    name: string;
    status: string;
    completionDate: Date;
  }) {
    this.gateway.emitStageCompletion(projectId, stage);
  }

  /**
   * Emit new chat message
   */
  emitNewMessage(conversationId: string, message: {
    id: string;
    senderId: string;
    sender?: {
      id: string;
      fullName: string;
      email: string;
    };
    content: string;
    type: string;
    read?: boolean;
    createdAt: Date;
  }) {
    this.gateway.emitNewMessage(conversationId, message);
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    this.gateway.emitUserNotification(userId, notification);
  }
}

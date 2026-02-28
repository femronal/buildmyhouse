import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Service to emit WebSocket events from other modules
 * Inject this service in your modules to send real-time updates
 */
@Injectable()
export class WebSocketService {
  constructor(
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly gateway: WebSocketGateway,
    private readonly notificationsService: NotificationsService,
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
    completionDate?: Date | null;
    startDate?: Date | null;
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
  async sendNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    await this.notificationsService.createForUser(userId, notification);
    this.gateway.emitUserNotification(userId, notification);
  }

  async sendNotificationToUsers(userIds: string[], notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    await this.notificationsService.createForUsers(uniqueUserIds, notification);
    uniqueUserIds.forEach((userId) => this.gateway.emitUserNotification(userId, notification));
  }

  async sendNotificationToRole(role: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    const userIds = await this.notificationsService.getUserIdsByRole(role);
    await this.sendNotificationToUsers(userIds, notification);
    return { count: userIds.length };
  }
}

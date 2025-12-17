import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class ChatService {
  private prisma = new PrismaClient();

  constructor(private readonly wsService: WebSocketService) {}

  /**
   * Send a message and emit real-time update
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
  ) {
    // Create message in database
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Emit real-time message to all clients in the conversation
    this.wsService.emitNewMessage(conversationId, {
      id: message.id,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        fullName: message.sender.fullName,
        email: message.sender.email,
      },
      content: message.content,
      type: message.type,
      read: message.read,
      createdAt: message.createdAt,
    });

    // Send notification to other participants
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (conversation) {
      const otherParticipants = conversation.participants.filter(
        (p) => p.id !== senderId,
      );
      otherParticipants.forEach((participant) => {
        this.wsService.sendNotification(participant.id, {
          type: 'new_message',
          title: 'New Message',
          message: `${message.sender.fullName}: ${content.substring(0, 50)}...`,
          data: {
            conversationId,
            messageId: message.id,
          },
        });
      });
    }

    return message;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId === userId) {
      return message;
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    });
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get or create conversation between users
   */
  async getOrCreateConversation(userIds: string[], projectId?: string) {
    // Try to find existing conversation
    const existing = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            id: {
              in: userIds,
            },
          },
        },
        projectId: projectId || null,
      },
      include: {
        participants: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        projectId,
        participants: {
          connect: userIds.map((id) => ({ id })),
        },
      },
      include: {
        participants: true,
        messages: true,
      },
    });
  }
}

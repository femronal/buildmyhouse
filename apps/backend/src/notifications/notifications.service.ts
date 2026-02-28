import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async createForUser(userId: string, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data as Prisma.InputJsonValue | undefined,
      },
    });

    // Fire-and-forget delivery channels; DB persistence is the source of truth.
    void this.dispatchPush(userId, dto);
    void this.dispatchEmail(userId, dto);

    return notification;
  }

  async createForUsers(userIds: string[], dto: CreateNotificationDto) {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueUserIds.length === 0) {
      return { count: 0 };
    }

    const results = await Promise.allSettled(
      uniqueUserIds.map((userId) => this.createForUser(userId, dto)),
    );

    return {
      count: results.filter((result) => result.status === 'fulfilled').length,
    };
  }

  async createForRole(role: string, dto: CreateNotificationDto) {
    const userIds = await this.getUserIdsByRole(role);
    return this.createForUsers(userIds, dto);
  }

  async getUserIdsByRole(role: string) {
    const users = await this.prisma.user.findMany({
      where: { role },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  async getMyNotifications(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { unreadCount, items };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  private async dispatchPush(userId: string, dto: CreateNotificationDto) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return;
    }

    const messages = tokens
      .map((item) => item.token)
      .filter((token) => token.startsWith('ExpoPushToken[') || token.startsWith('ExponentPushToken['))
      .map((to) => ({
        to,
        title: dto.title,
        body: dto.message,
        data: dto.data,
        sound: 'default',
      }));

    if (messages.length === 0) {
      return;
    }

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });
    } catch (error: any) {
      this.logger.warn(`Push dispatch failed for user ${userId}: ${error?.message || 'unknown error'}`);
    }
  }

  private async dispatchEmail(userId: string, dto: CreateNotificationDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      if (!user?.email) {
        this.logger.debug(`Email skipped for user ${userId}: no email on record`);
        return;
      }

      await this.emailService.sendNotificationEmail({
        to: user.email,
        recipientName: user.fullName || 'User',
        title: dto.title,
        message: dto.message,
        data: dto.data as Record<string, unknown> | undefined,
      });
    } catch (error: any) {
      this.logger.warn(
        `Email dispatch failed for user ${userId}: ${error?.message || 'unknown error'}`,
      );
    }
  }
}

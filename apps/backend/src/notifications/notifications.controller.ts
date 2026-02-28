import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  getMine(@Req() req: any) {
    return this.notificationsService.getMyNotifications(req.user?.sub);
  }

  @Get('me/unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user?.sub);
  }

  @Patch('me/read-all')
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user?.sub);
    return { message: 'Notifications marked as read' };
  }

  @Patch('me/:id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    await this.notificationsService.markAsRead(req.user?.sub, id);
    return { message: 'Notification marked as read' };
  }
}

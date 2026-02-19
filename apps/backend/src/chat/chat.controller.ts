import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  async getOrCreateConversation(
    @Request() req: any,
    @Body() body: { userIds: string[]; projectId?: string },
  ) {
    const currentUserId = req.user.sub;
    // Ensure current user is included in the conversation
    const userIds = [...new Set([currentUserId, ...body.userIds])];
    if (userIds.length < 2) {
      throw new BadRequestException('Conversation must include at least 2 participants');
    }
    return this.chatService.getOrCreateConversation(userIds, body.projectId);
  }

  // Delete route must come before messages route to avoid route conflicts
  @Delete('conversations/:conversationId')
  @UseGuards(JwtAuthGuard)
  async deleteConversation(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.sub;
    return this.chatService.deleteConversation(conversationId, userId);
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getConversationMessages(conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body() body: { content: string; type?: 'text' | 'image' | 'file' },
  ) {
    const senderId = req.user.sub;
    return this.chatService.sendMessage(
      conversationId,
      senderId,
      body.content,
      body.type || 'text',
    );
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getUserConversations(@Request() req: any) {
    const userId = req.user.sub;
    return this.chatService.getUserConversations(userId);
  }

  @Get('conversations/:conversationId/unread-count')
  @UseGuards(JwtAuthGuard)
  async getConversationUnreadCount(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.sub;
    const count = await this.chatService.getConversationUnreadCount(conversationId, userId);
    return { unreadCount: count };
  }

  @Post('conversations/:conversationId/mark-read')
  @UseGuards(JwtAuthGuard)
  async markConversationAsRead(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.sub;
    return this.chatService.markConversationAsRead(conversationId, userId);
  }
}


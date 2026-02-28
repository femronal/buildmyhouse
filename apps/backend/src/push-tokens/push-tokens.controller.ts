import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UnregisterPushTokenDto } from './dto/unregister-push-token.dto';
import { PushTokensService } from './push-tokens.service';

@Controller('push-tokens')
@UseGuards(JwtAuthGuard)
export class PushTokensController {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @Post('register')
  register(@Req() req: any, @Body() dto: RegisterPushTokenDto) {
    return this.pushTokensService.register(req.user?.sub, dto);
  }

  @Post('unregister')
  unregister(@Req() req: any, @Body() dto: UnregisterPushTokenDto) {
    return this.pushTokensService.unregister(req.user?.sub, dto);
  }
}

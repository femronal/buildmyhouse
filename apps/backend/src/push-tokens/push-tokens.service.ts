import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UnregisterPushTokenDto } from './dto/unregister-push-token.dto';

@Injectable()
export class PushTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, dto: RegisterPushTokenDto) {
    await this.prisma.pushToken.upsert({
      where: { token: dto.token },
      create: {
        token: dto.token,
        userId,
        platform: dto.platform,
        app: dto.app,
        deviceId: dto.deviceId,
      },
      update: {
        userId,
        platform: dto.platform,
        app: dto.app,
        deviceId: dto.deviceId,
        lastUsedAt: new Date(),
      },
    });

    return { message: 'Push token registered' };
  }

  async unregister(userId: string, dto: UnregisterPushTokenDto) {
    await this.prisma.pushToken.deleteMany({
      where: {
        userId,
        token: dto.token,
      },
    });

    return { message: 'Push token unregistered' };
  }
}

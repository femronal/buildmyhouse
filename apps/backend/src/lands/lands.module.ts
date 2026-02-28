import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { LandsController } from './lands.controller';
import { LandsService } from './lands.service';

@Module({
  imports: [AuthModule, PrismaModule, WebSocketModule],
  controllers: [LandsController],
  providers: [LandsService],
  exports: [LandsService],
})
export class LandsModule {}

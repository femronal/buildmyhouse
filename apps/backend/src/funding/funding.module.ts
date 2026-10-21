import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadModule } from '../upload/upload.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { FundingController } from './funding.controller';
import { FundingService } from './funding.service';

@Module({
  imports: [AuthModule, UploadModule, WebSocketModule],
  controllers: [FundingController],
  providers: [FundingService],
  exports: [FundingService],
})
export class FundingModule {}

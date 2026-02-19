import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LandsController } from './lands.controller';
import { LandsService } from './lands.service';

@Module({
  imports: [AuthModule],
  controllers: [LandsController],
  providers: [LandsService],
  exports: [LandsService],
})
export class LandsModule {}

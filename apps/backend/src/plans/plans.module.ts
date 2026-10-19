import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { OpenAIModule } from '../openai/openai.module';
import { AuthModule } from '../auth/auth.module';
import { UploadModule } from '../upload/upload.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [OpenAIModule, AuthModule, UploadModule, ReferralsModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}



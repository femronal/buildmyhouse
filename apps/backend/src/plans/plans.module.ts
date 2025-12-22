import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { OpenAIModule } from '../openai/openai.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [OpenAIModule, AuthModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}

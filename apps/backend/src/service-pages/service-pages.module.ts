import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OpenAIModule } from '../openai/openai.module';
import { ServicePagesController } from './service-pages.controller';
import { ServicePagesService } from './service-pages.service';

@Module({
  imports: [AuthModule, OpenAIModule],
  controllers: [ServicePagesController],
  providers: [ServicePagesService],
  exports: [ServicePagesService],
})
export class ServicePagesModule {}

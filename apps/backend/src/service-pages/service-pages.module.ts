import { Module } from '@nestjs/common';
import { ServicePagesController } from './service-pages.controller';
import { ServicePagesService } from './service-pages.service';

@Module({
  controllers: [ServicePagesController],
  providers: [ServicePagesService],
  exports: [ServicePagesService],
})
export class ServicePagesModule {}

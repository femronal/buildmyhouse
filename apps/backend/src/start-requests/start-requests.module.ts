import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StartRequestsController } from './start-requests.controller';
import { StartRequestsService } from './start-requests.service';

@Module({
  imports: [PrismaModule],
  controllers: [StartRequestsController],
  providers: [StartRequestsService],
})
export class StartRequestsModule {}
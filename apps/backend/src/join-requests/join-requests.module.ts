import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JoinRequestsAdminController } from './join-requests-admin.controller';
import { JoinRequestsController } from './join-requests.controller';
import { JoinRequestsService } from './join-requests.service';

@Module({
  imports: [PrismaModule],
  controllers: [JoinRequestsController, JoinRequestsAdminController],
  providers: [JoinRequestsService],
})
export class JoinRequestsModule {}

import { Module } from '@nestjs/common';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JoinRequestsAdminController } from './join-requests-admin.controller';
import { JoinRequestsController } from './join-requests.controller';
import { JoinRequestsService } from './join-requests.service';

@Module({
  imports: [PrismaModule, AuthModule, AdminAccessModule],
  controllers: [JoinRequestsController, JoinRequestsAdminController],
  providers: [JoinRequestsService],
})
export class JoinRequestsModule {}

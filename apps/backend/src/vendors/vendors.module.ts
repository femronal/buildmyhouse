import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { VendorsPublicController } from './vendors-public.controller';
import { VendorsAdminController } from './vendors-admin.controller';
import { VendorsService } from './vendors.service';

@Module({
  imports: [PrismaModule, AuthModule, EmailModule, AdminAccessModule],
  controllers: [VendorsPublicController, VendorsAdminController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}

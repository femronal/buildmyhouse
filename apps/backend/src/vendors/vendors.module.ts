import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { UploadModule } from '../upload/upload.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { VendorsPublicController } from './vendors-public.controller';
import { VendorsAdminController } from './vendors-admin.controller';
import { VendorCategoriesAdminController } from './vendor-categories-admin.controller';
import { VendorsService } from './vendors.service';
import { VendorCategoriesService } from './vendor-categories.service';

@Module({
  imports: [PrismaModule, AuthModule, EmailModule, AdminAccessModule, UploadModule],
  controllers: [VendorsPublicController, VendorsAdminController, VendorCategoriesAdminController],
  providers: [VendorsService, VendorCategoriesService],
  exports: [VendorsService],
})
export class VendorsModule {}

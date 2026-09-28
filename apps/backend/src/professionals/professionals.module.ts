import { Module } from '@nestjs/common';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { ProfessionalsAdminController } from './professionals-admin.controller';
import { ProfessionalsPublicController } from './professionals-public.controller';
import { ProfessionalsService } from './professionals.service';

@Module({
  imports: [PrismaModule, AuthModule, AdminAccessModule, EmailModule, UploadModule],
  controllers: [ProfessionalsPublicController, ProfessionalsAdminController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}

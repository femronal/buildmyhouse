import { Module } from '@nestjs/common';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ArtisansAdminController } from './artisans-admin.controller';
import { ArtisansOwnerController } from './artisans-owner.controller';
import { ArtisansPublicController } from './artisans-public.controller';
import { ArtisansService } from './artisans.service';

@Module({
  imports: [PrismaModule, AuthModule, AdminAccessModule, EmailModule],
  controllers: [ArtisansOwnerController, ArtisansPublicController, ArtisansAdminController],
  providers: [ArtisansService],
  exports: [ArtisansService],
})
export class ArtisansModule {}

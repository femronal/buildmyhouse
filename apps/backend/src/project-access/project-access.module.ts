import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { ProjectAccessController } from './project-access.controller';
import { ProjectAccessService } from './project-access.service';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [ProjectAccessController],
  providers: [ProjectAccessService],
  exports: [ProjectAccessService],
})
export class ProjectAccessModule {}

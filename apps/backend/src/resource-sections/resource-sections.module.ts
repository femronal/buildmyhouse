import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResourceSectionsController } from './resource-sections.controller';
import { ResourceSectionsService } from './resource-sections.service';

@Module({
  imports: [AuthModule],
  controllers: [ResourceSectionsController],
  providers: [ResourceSectionsService],
  exports: [ResourceSectionsService],
})
export class ResourceSectionsModule {}

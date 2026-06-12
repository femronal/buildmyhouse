import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { AuthModule } from '../auth/auth.module';
import { ResourceSectionsModule } from '../resource-sections/resource-sections.module';

@Module({
  imports: [AuthModule, ResourceSectionsModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}

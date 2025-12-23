import { Module } from '@nestjs/common';
import { MaterialsController } from './controllers/materials.controller';
import { ContractorsController } from './controllers/contractors.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { SearchController } from './controllers/search.controller';
import { MaterialsService } from './services/materials.service';
import { ContractorsService } from './services/contractors.service';
import { ReviewsService } from './services/reviews.service';
import { SearchService } from './services/search.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    MaterialsController,
    ContractorsController,
    ReviewsController,
    SearchController,
  ],
  providers: [
    MaterialsService,
    ContractorsService,
    ReviewsService,
    SearchService,
  ],
  exports: [
    MaterialsService,
    ContractorsService,
    ReviewsService,
    SearchService,
  ],
})
export class MarketplaceModule {}



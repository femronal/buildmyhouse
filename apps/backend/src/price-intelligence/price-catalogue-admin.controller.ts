import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PriceCatalogueAdminService } from './price-catalogue-admin.service';

/**
 * READ-ONLY admin catalogue view (Stage 3 exit criterion: proves complete
 * database round-tripping of the seeded taxonomy). Admin-only; there are
 * deliberately no write endpoints — catalogue changes require the
 * PriceTaxonomyChangeRequest approval flow built in a later stage.
 */
@Controller('admin/price-catalogue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PriceCatalogueAdminController {
  constructor(private readonly service: PriceCatalogueAdminService) {}

  @Get('overview')
  getOverview() {
    return this.service.getOverview();
  }

  @Get('families')
  listFamilies() {
    return this.service.listFamilies();
  }

  @Get('families/:key')
  getFamily(@Param('key') key: string) {
    return this.service.getFamilyByKey(key);
  }

  @Get('units')
  listUnits() {
    return this.service.listUnits();
  }

  @Get('conversion-rules')
  listConversionRules() {
    return this.service.listConversionRules();
  }

  @Get('locations')
  listLocations() {
    return this.service.listLocations();
  }

  @Get('sources')
  listSources() {
    return this.service.listSources();
  }

  @Get('service-families')
  listServiceFamilies() {
    return this.service.listServiceFamilies();
  }
}

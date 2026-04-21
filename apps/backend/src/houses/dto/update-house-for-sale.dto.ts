import { PartialType } from '@nestjs/mapped-types';
import { CreateHouseForSaleDto } from './create-house-for-sale.dto';

export class UpdateHouseForSaleDto extends PartialType(CreateHouseForSaleDto) {}

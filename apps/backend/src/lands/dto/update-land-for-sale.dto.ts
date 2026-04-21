import { PartialType } from '@nestjs/mapped-types';
import { CreateLandForSaleDto } from './create-land-for-sale.dto';

export class UpdateLandForSaleDto extends PartialType(CreateLandForSaleDto) {}

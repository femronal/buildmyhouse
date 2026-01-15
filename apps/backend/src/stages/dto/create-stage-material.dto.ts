import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateStageMaterialDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string; // 'kg' | 'bags' | 'pieces' | 'liters' | 'meters' | etc.

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  supplierContact?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  deliveryDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}



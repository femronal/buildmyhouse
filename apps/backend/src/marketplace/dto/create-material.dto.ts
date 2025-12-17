import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  brand: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

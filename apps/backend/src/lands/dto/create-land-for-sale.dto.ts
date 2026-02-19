import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class LandForSaleImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateLandForSaleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  location: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  sizeSqm: number;

  @IsOptional()
  @IsString()
  titleDocument?: string;

  @IsOptional()
  @IsString()
  zoningType?: string;

  @IsOptional()
  @IsString()
  topography?: string;

  @IsOptional()
  @IsString()
  roadAccess?: string;

  @IsOptional()
  @IsString()
  ownershipType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nearbyLandmarks?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsArray()
  images: LandForSaleImageDto[];
}

import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RentalListingImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateRentalListingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  propertyType: string;

  @IsString()
  location: string;

  @IsNumber()
  @Min(0)
  annualRent: number;

  @IsNumber()
  @Min(0)
  serviceCharge: number;

  @IsNumber()
  @Min(0)
  cautionDeposit: number;

  @IsNumber()
  @Min(0)
  legalFeePercent: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  agencyFeePercent?: number;

  @IsNumber()
  @Min(0)
  bedrooms: number;

  @IsNumber()
  @Min(0)
  bathrooms: number;

  @IsNumber()
  @Min(0)
  sizeSqm: number;

  @IsOptional()
  @IsString()
  furnishing?: string;

  @IsOptional()
  @IsString()
  paymentPattern?: string;

  @IsOptional()
  @IsString()
  power?: string;

  @IsOptional()
  @IsString()
  water?: string;

  @IsOptional()
  @IsString()
  internet?: string;

  @IsOptional()
  @IsString()
  parking?: string;

  @IsOptional()
  @IsString()
  security?: string;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  inspectionWindow?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  proximity?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationDocs?: string[];

  @IsArray()
  images: RentalListingImageDto[];
}


import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class DesignImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class ConstructionPhaseDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  estimatedDuration: string;

  @IsNumber()
  @Min(0)
  estimatedCost: number;
}

export class CreateDesignDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  bedrooms: number;

  @IsNumber()
  @Min(1)
  bathrooms: number;

  @IsNumber()
  @Min(1)
  squareFootage: number;

  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  floors?: number;

  @IsOptional()
  @IsString()
  estimatedDuration?: string;

  @IsOptional()
  @IsString()
  rooms?: string;

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsString()
  constructionPhases?: string;

  @IsArray()
  images: DesignImageDto[];
}


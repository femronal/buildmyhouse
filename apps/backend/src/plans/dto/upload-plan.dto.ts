import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsIn,
  IsArray,
  ArrayMaxSize,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UploadPlanDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget: number;

  @IsString()
  @IsIn(['homebuilding', 'renovation', 'interior_design'])
  projectType: 'homebuilding' | 'renovation' | 'interior_design';

  @IsString()
  planImageUrl: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
  })
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  planImageUrls?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(60)
  projectTypeTag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  projectTypeFilter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  projectDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  successCriteria?: string;
}




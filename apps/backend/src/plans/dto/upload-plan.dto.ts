import { IsString, IsNumber, IsOptional, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

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
}




import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStageChangeRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['additional_funding', 'additional_timing', 'change_of_site'], { each: true })
  requestTypes: Array<'additional_funding' | 'additional_timing' | 'change_of_site'>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalDurationDays?: number;

  @IsOptional()
  @IsBoolean()
  requestedSiteChange?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  siteChangeDetails?: string;

  @IsString()
  @MaxLength(3000)
  reason: string;

  @IsArray()
  @ArrayMinSize(1)
  evidence: Array<{
    url: string;
    type: string;
    label?: string;
  }>;
}

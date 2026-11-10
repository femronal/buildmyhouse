import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStageMediaDto {
  @IsEnum(['photo', 'video'])
  type: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsIn(['camera', 'gallery'])
  captureMethod?: 'camera' | 'gallery';

  @IsOptional()
  @IsISO8601()
  capturedAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  captureLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  captureLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  accuracyMeters?: number;

  @IsOptional()
  @IsString()
  sha256?: string;

  @IsOptional()
  @IsString()
  originalSha256?: string;

  @IsOptional()
  @IsString()
  fingerprintToken?: string;
}



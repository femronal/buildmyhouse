import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import type { ServicePagePayload, ServicePageRegion } from '../service-page-content';

export class UpsertServicePageDto {
  @IsString()
  slug: string;

  @IsIn(['lagos', 'nigeria'])
  region: ServicePageRegion;

  @IsString()
  templateKind: string;

  @IsString()
  metaTitle: string;

  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  canonicalPath?: string;

  @IsObject()
  payload: ServicePagePayload;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

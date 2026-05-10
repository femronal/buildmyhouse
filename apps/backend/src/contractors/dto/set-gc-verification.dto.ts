import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export const GC_SPECIALTY_CATEGORIES = [
  'repairer',
  'upgrader',
  'renovator',
  'general_contractor',
] as const;

export type GCSpecialtyCategory = (typeof GC_SPECIALTY_CATEGORIES)[number];

export class SetGCVerificationDto {
  @IsBoolean()
  verified!: boolean;

  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(GC_SPECIALTY_CATEGORIES)
  specialtyCategory?: GCSpecialtyCategory;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  specialtyTags?: string[];
}


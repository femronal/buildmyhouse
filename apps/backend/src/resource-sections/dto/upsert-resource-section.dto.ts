import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class UpsertResourceSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Key must be lowercase letters, numbers, and hyphens (e.g. cost-guides)',
  })
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  hint?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { ListingKind, ListingReviewStatus, ScamReportStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const KINDS = [ListingKind.professional, ListingKind.vendor, ListingKind.artisan];

export class ListingReviewBodyDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  comment!: string;
}

export class RejectListingReviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

export class ListingPageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

export class AdminListingReviewQueryDto extends ListingPageQueryDto {
  @IsOptional()
  @IsIn(Object.values(ListingReviewStatus))
  status?: ListingReviewStatus;

  @IsOptional()
  @IsIn(KINDS)
  kind?: ListingKind;
}

export class ScamReportBodyDto {
  @IsString()
  @MinLength(50)
  @MaxLength(5000)
  whatHappened!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountNaira?: number;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  evidenceUrls?: string[];

  @IsBoolean()
  contactConsent!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;
}

export class AdminScamReportQueryDto extends ListingPageQueryDto {
  @IsOptional()
  @IsIn(Object.values(ScamReportStatus))
  status?: ScamReportStatus;

  @IsOptional()
  @IsIn(KINDS)
  kind?: ListingKind;
}

export class UpdateScamReportDto {
  @IsOptional()
  @IsIn(Object.values(ScamReportStatus))
  status?: ScamReportStatus;

  @IsOptional()
  @IsString()
  assignedAdminId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  adminNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  publicNotice?: string;
}

import { IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ArtisanCheckStatus,
  ArtisanListingStatus,
  ArtisanMediaReviewStatus,
  ArtisanMediaType,
  ArtisanRecruitmentStatus,
  ArtisanSourceType,
  ArtisanVerificationCheckKey,
  ArtisanVerificationStatus,
} from '@prisma/client';

export class PublicArtisanSearchDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() trade?: string;
  @IsOptional() @IsString() service?: string;
  @IsOptional() @IsString() problem?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) verifiedOnly?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) usedByBmh?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) claimed?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) hasWorkshop?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 20;
}

export class ArtisanApplicationDto {
  @IsString() @MinLength(2) @MaxLength(160) displayName!: string;
  @IsOptional() @IsString() @MaxLength(160) businessName?: string;
  @IsString() @MinLength(2) tradeKey!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) serviceLabels?: string[];
}

export class ArtisanClaimRequestDto {
  @IsString() slug!: string;
  @IsString() @MinLength(2) requesterName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class ArtisanOwnerUpdateDto {
  @IsOptional() @IsString() @MaxLength(160) displayName?: string;
  @IsOptional() @IsString() @MaxLength(160) businessName?: string;
  @IsOptional() @IsString() @MaxLength(4000) bio?: string;
  @IsOptional() @IsString() primaryTradeId?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsBoolean() publicPhone?: boolean;
  @IsOptional() @IsBoolean() publicEmail?: boolean;
  @IsOptional() @IsBoolean() publicWhatsapp?: boolean;
  @IsOptional() @IsBoolean() publicWebsite?: boolean;
  @IsOptional() @IsString() workingHours?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) serviceStates?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) serviceCities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) capabilityIds?: string[];
}

export class ArtisanMediaInputDto {
  @IsEnum(ArtisanMediaType) mediaType!: ArtisanMediaType;
  @IsString() @MinLength(1) fileRef!: string;
  @IsOptional() @IsString() label?: string;
}

export class ArtisanVerificationSubmitDto {
  @IsEnum(ArtisanVerificationCheckKey) checkKey!: ArtisanVerificationCheckKey;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsString() evidenceFileRef?: string;
}

export class AdminArtisanWriteDto {
  @IsString() @MinLength(2) @MaxLength(160) displayName!: string;
  @IsOptional() @IsString() businessName?: string;
  @IsString() tradeKey!: string;
  @IsOptional() @IsString() @MaxLength(4000) bio?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) serviceStates?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) serviceCities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) capabilityIds?: string[];
  @IsOptional() @IsEnum(ArtisanSourceType) sourceType?: ArtisanSourceType;
  @IsOptional() @IsString() sourceNotes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) sourceUrls?: string[];
  @IsOptional() @IsBoolean() acknowledgeDuplicates?: boolean;
  @IsOptional() @IsBoolean() sendClaimInvite?: boolean;
  @IsOptional() @IsEmail() inviteEmail?: string;
  @IsOptional() @IsString() invitePhone?: string;
  @IsOptional() @IsEnum(ArtisanListingStatus) listingStatus?: ArtisanListingStatus;
}

export class AdminArtisanPatchDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() businessName?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() tradeKey?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) serviceStates?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) serviceCities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) capabilityIds?: string[];
  @IsOptional() @IsString() workingHours?: string;
  @IsOptional() @IsString() internalNotes?: string;
  @IsOptional() @IsString() availabilityNotes?: string;
  @IsOptional() @IsString() callOutFeeNotes?: string;
  @IsOptional() @IsString() inspectionFeeNotes?: string;
  @IsOptional() @IsString() workmanshipNotes?: string;
  @IsOptional() @IsString() transportNotes?: string;
  @IsOptional() @IsBoolean() emergencyJobs?: boolean;
  @IsOptional() @IsBoolean() sameDayJobs?: boolean;
  @IsOptional() @IsBoolean() weekendWork?: boolean;
  @IsOptional() @IsInt() crewSize?: number;
  @IsOptional() @IsBoolean() hasWorkshop?: boolean;
  @IsOptional() @IsBoolean() hasVehicle?: boolean;
  @IsOptional() @IsBoolean() ownsTools?: boolean;
  @IsOptional() @IsBoolean() canIssueInvoice?: boolean;
  @IsOptional() @IsBoolean() residentialExperience?: boolean;
  @IsOptional() @IsBoolean() commercialExperience?: boolean;
  @IsOptional() @IsBoolean() usedByBmh?: boolean;
  @IsOptional() @IsString() usedByBmhNote?: string;
  @IsOptional() @IsString() sourceNotes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) sourceUrls?: string[];
}

export class AdminArtisanSearchDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() trade?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() claimStatus?: string;
  @IsOptional() @IsEnum(ArtisanVerificationStatus) verificationStatus?: ArtisanVerificationStatus;
  @IsOptional() @IsEnum(ArtisanRecruitmentStatus) recruitmentStatus?: ArtisanRecruitmentStatus;
  @IsOptional() @IsEnum(ArtisanListingStatus) listingStatus?: ArtisanListingStatus;
  @IsOptional() @IsEnum(ArtisanSourceType) sourceType?: ArtisanSourceType;
  @IsOptional() @IsBoolean() @Type(() => Boolean) usedByBmh?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) missingWorkshop?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) contacted?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() trustMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() trustMax?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 30;
}

export class AdminListingStatusDto {
  @IsEnum(ArtisanListingStatus) listingStatus!: ArtisanListingStatus;
}

export class AdminRecruitmentDto {
  @IsEnum(ArtisanRecruitmentStatus) recruitmentStatus!: ArtisanRecruitmentStatus;
}

export class AdminVerificationDto {
  @IsEnum(ArtisanVerificationStatus) verificationStatus!: ArtisanVerificationStatus;
  @IsOptional() @IsEnum(ArtisanVerificationCheckKey) checkKey?: ArtisanVerificationCheckKey;
  @IsOptional() @IsEnum(ArtisanCheckStatus) checkStatus?: ArtisanCheckStatus;
  @IsOptional() @IsString() notes?: string;
}

export class AdminMediaReviewDto {
  @IsEnum(ArtisanMediaReviewStatus) reviewStatus!: ArtisanMediaReviewStatus;
  @IsOptional() @IsString() rejectionReason?: string;
}

export class AdminClaimInviteDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsInt() @Min(1) @Max(30) expiresInDays?: number;
}

export class AdminClaimReviewDto {
  @IsIn(['approved', 'rejected']) status!: 'approved' | 'rejected';
  @IsOptional() @IsString() notes?: string;
}

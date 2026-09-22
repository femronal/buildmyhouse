import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  ProfessionalAvailabilityStatus,
  ProfessionalEngagementStatus,
  ProfessionalListingStatus,
  ProfessionalOwnershipStatus,
  ProfessionalProcurementStatus,
  ProfessionalReviewStatus,
  ProfessionalSourceType,
  ProfessionalType,
  ProfessionalVerificationStatus,
} from '@prisma/client';

export class PublicProfessionalSearchDto {
  @IsOptional() @IsString() @MaxLength(160) q?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() service?: string;
  @IsOptional() @IsString() deliverable?: string;
  @IsOptional() @IsString() projectStage?: string;
  @IsOptional() @IsString() need?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) credentialChecked?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) usedByBmh?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) remoteConsultation?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) siteVisits?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) signedReport?: boolean;
  @IsOptional() @IsEnum(ProfessionalType) professionalType?: ProfessionalType;
  @IsOptional() @IsIn(['best', 'name']) sort?: 'best' | 'name';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 20;
}

export class ApplyProfessionalDto {
  @IsEnum(ProfessionalType) professionalType!: ProfessionalType;
  @IsString() @MinLength(2) @MaxLength(160) displayName!: string;
  @IsOptional() @IsString() professionKey?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20) specialtyKeys?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(30) serviceKeys?: string[];
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() @MaxLength(40) whatsapp?: string;
  @IsOptional() @IsString() @MaxLength(240) website?: string;
  @IsOptional() @IsString() @MaxLength(80) state?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(40) regulatorKey?: string;
  @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @IsOptional() @IsString() @MaxLength(2000) shortDescription?: string;
}

export class ClaimProfessionalDto {
  @IsOptional() @IsString() listingId?: string;
  @IsOptional() @IsString() slug?: string;
  @IsString() @MinLength(2) @MaxLength(160) requesterName!: string;
  @IsString() @MinLength(2) @MaxLength(120) relationshipToPractice!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(80) proofMethod?: string;
  @IsOptional() @IsString() @MaxLength(2000) proofNotes?: string;
}

export class ProfessionalEnquiryDto {
  @IsOptional() @IsString() listingId?: string;
  @IsOptional() @IsString() slug?: string;
  @IsString() @MinLength(2) @MaxLength(160) requesterName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(80) propertyState?: string;
  @IsOptional() @IsString() @MaxLength(80) propertyCity?: string;
  @IsString() @MinLength(4) @MaxLength(240) whatDoYouNeed!: string;
  @IsOptional() @IsString() @MaxLength(4000) message?: string;
}

export class AdminProfessionalSearchDto {
  @IsOptional() @IsString() @MaxLength(160) query?: string;
  @IsOptional() @IsEnum(ProfessionalListingStatus) listingStatus?: ProfessionalListingStatus;
  @IsOptional() @IsEnum(ProfessionalVerificationStatus) verificationStatus?: ProfessionalVerificationStatus;
  @IsOptional() @IsEnum(ProfessionalProcurementStatus) procurementStatus?: ProfessionalProcurementStatus;
  @IsOptional() @IsEnum(ProfessionalOwnershipStatus) ownershipStatus?: ProfessionalOwnershipStatus;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) usedByBmh?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) incomplete?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 30;
}

export class AdminProfessionalWriteDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) displayName?: string;
  @IsOptional() @IsEnum(ProfessionalType) professionalType?: ProfessionalType;
  @IsOptional() @IsString() primaryProfessionId?: string;
  @IsOptional() @IsString() @MaxLength(4000) bio?: string;
  @IsOptional() @IsInt() @Min(0) @Max(80) yearsExperience?: number;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(40) whatsapp?: string;
  @IsOptional() @IsString() @MaxLength(240) website?: string;
  @IsOptional() @IsString() @MaxLength(240) address?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(80) state?: string;
  @IsOptional() @IsString() @MaxLength(40) stateKey?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(40) serviceStates?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(60) serviceCities?: string[];
  @IsOptional() @IsBoolean() remoteConsultation?: boolean;
  @IsOptional() @IsBoolean() siteVisits?: boolean;
  @IsOptional() @IsBoolean() canIssueSignedReport?: boolean;
  @IsOptional() @IsBoolean() publicPhone?: boolean;
  @IsOptional() @IsBoolean() publicEmail?: boolean;
  @IsOptional() @IsBoolean() publicWhatsapp?: boolean;
  @IsOptional() @IsBoolean() publicWebsite?: boolean;
  @IsOptional() @IsEnum(ProfessionalListingStatus) listingStatus?: ProfessionalListingStatus;
  @IsOptional() @IsEnum(ProfessionalOwnershipStatus) ownershipStatus?: ProfessionalOwnershipStatus;
  @IsOptional() @IsEnum(ProfessionalProcurementStatus) procurementStatus?: ProfessionalProcurementStatus;
  @IsOptional() @IsEnum(ProfessionalSourceType) sourceType?: ProfessionalSourceType;
  @IsOptional() @IsString() @MaxLength(4000) sourceNotes?: string;
  @IsOptional() @IsArray() @IsUrl({}, { each: true }) @ArrayMaxSize(10) sourceUrls?: string[];
  @IsOptional() @IsBoolean() usedByBmh?: boolean;
  @IsOptional() @IsString() usedByBmhSince?: string;
  @IsOptional() @IsString() @MaxLength(2000) usedByBmhNote?: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(40) specialtyIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(40) serviceIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(40) deliverableIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(40) projectStageIds?: string[];
}

export class AdminCreateProfessionalDto extends AdminProfessionalWriteDto {
  @IsString() @MinLength(2) @MaxLength(160) displayName!: string;
  @IsString() primaryProfessionId!: string;
}

export class AdminListingStatusDto {
  @IsEnum(ProfessionalListingStatus) listingStatus!: ProfessionalListingStatus;
}

export class AdminVerificationActionDto {
  @IsEnum(ProfessionalVerificationStatus) verificationStatus!: ProfessionalVerificationStatus;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

export class AdminCredentialDto {
  @IsOptional() @IsString() @MaxLength(80) credentialType?: string;
  @IsOptional() @IsString() @MaxLength(40) regulatorKey?: string;
  @IsOptional() @IsString() @MaxLength(80) regulatorLabel?: string;
  @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @IsOptional() @IsString() @MaxLength(160) holderName?: string;
  @IsOptional() @IsEnum(ProfessionalType) holderType?: ProfessionalType;
  @IsOptional() @IsString() verificationSourceUrl?: string;
  @IsOptional() @IsString() issuedAt?: string;
  @IsOptional() @IsString() expiresAt?: string;
  @IsOptional() @IsString() @MaxLength(2000) verificationNotes?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsBoolean() markChecked?: boolean;
}

export class AdminCredentialDocumentDto {
  @IsString() @MaxLength(80) documentType!: string;
  @IsString() @MaxLength(240) fileName!: string;
  @IsString() @MaxLength(500) fileRef!: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsInt() fileSizeBytes?: number;
}

export class AdminProcurementDto {
  @IsOptional() @IsEnum(ProfessionalAvailabilityStatus) availabilityStatus?: ProfessionalAvailabilityStatus;
  @IsOptional() @IsNumber() inspectionFee?: number;
  @IsOptional() @IsNumber() reportFee?: number;
  @IsOptional() @IsNumber() consultationFee?: number;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsString() @MaxLength(2000) travelFeeNotes?: string;
  @IsOptional() @IsString() @MaxLength(4000) rateNotes?: string;
  @IsOptional() @IsInt() @Min(1) @Max(2000) typicalTurnaroundHours?: number;
  @IsOptional() @IsBoolean() acceptsBmhNegotiatedRates?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(30) capabilityTags?: string[];
  @IsOptional() @IsString() lastContactedAt?: string;
  @IsOptional() @IsString() @MaxLength(8000) internalNotes?: string;
  @IsOptional() @IsEnum(ProfessionalProcurementStatus) procurementStatus?: ProfessionalProcurementStatus;
}

export class AdminReviewDto {
  @IsEnum(ProfessionalReviewStatus) status!: ProfessionalReviewStatus;
  @IsOptional() @IsString() @MaxLength(4000) adminNotes?: string;
  @IsOptional() @IsBoolean() createListing?: boolean;
}

export class AdminEngagementDto {
  @IsString() projectId!: string;
  @IsOptional() @IsString() stageId?: string;
  @IsString() @MinLength(8) @MaxLength(2000) purpose!: string;
  @IsOptional() @IsString() serviceId?: string;
  @IsOptional() @IsString() requiredDeliverableId?: string;
  @IsOptional() @IsNumber() fee?: number;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsEnum(ProfessionalEngagementStatus) status?: ProfessionalEngagementStatus;
  @IsOptional() @IsString() dueAt?: string;
  @IsOptional() @IsString() @MaxLength(500) reportUrl?: string;
  @IsOptional() @IsString() @MaxLength(4000) reportNotes?: string;
  @IsOptional() @IsString() @MaxLength(4000) professionalRecommendation?: string;
  @IsOptional() @IsString() @MaxLength(4000) internalDecisionNotes?: string;
}

export class AdminEngagementUpdateDto {
  @IsOptional() @IsEnum(ProfessionalEngagementStatus) status?: ProfessionalEngagementStatus;
  @IsOptional() @IsString() stageId?: string;
  @IsOptional() @IsNumber() fee?: number;
  @IsOptional() @IsString() dueAt?: string;
  @IsOptional() @IsString() @MaxLength(500) reportUrl?: string;
  @IsOptional() @IsString() @MaxLength(4000) reportNotes?: string;
  @IsOptional() @IsString() @MaxLength(4000) professionalRecommendation?: string;
  @IsOptional() @IsString() @MaxLength(4000) internalDecisionNotes?: string;
}

export class AdminTaxonomyPatchDto {
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @MaxLength(160) label?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

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
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  VendorAcquisitionSource,
  VendorActivityType,
  VendorClaimStatus,
  VendorAddressVisibility,
  VendorDocumentType,
  VendorListingStatus,
  VendorPreferredContactMethod,
  VendorProcurementRelationship,
  VendorVerificationCheckKey,
  VendorVerificationCheckStatus,
  VendorVerificationStatus,
} from '@prisma/client';

export class VendorOfferingInputDto {
  @IsOptional() @IsString() familyKey?: string;
  @IsOptional() @IsString() categoryCode?: string;
  @IsOptional() @IsString() @MaxLength(120) customCategoryLabel?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(40) productTypes?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(40) brands?: string[];
  @IsOptional() @IsBoolean() sellsRetail?: boolean;
  @IsOptional() @IsBoolean() sellsWholesale?: boolean;
  @IsOptional() @IsString() normalUnit?: string;
  @IsOptional() @IsNumber() minimumOrderQuantity?: number;
  @IsOptional() @IsString() minimumOrderUnit?: string;
  @IsOptional() @IsBoolean() stockedNormally?: boolean;
  @IsOptional() @IsBoolean() specialOrder?: boolean;
  @IsOptional() @IsBoolean() deliveryAvailable?: boolean;
  @IsOptional() @IsBoolean() installationAvailable?: boolean;
  @IsOptional() @IsBoolean() acceptsQuotations?: boolean;
  @IsOptional() @IsBoolean() pricesNegotiable?: boolean;
  @IsOptional() @IsString() quantityBreakNotes?: string;
  @IsOptional() @IsString() deliveryPricingMethod?: string;
  @IsOptional() @IsBoolean() deliveryIncluded?: boolean;
  @IsOptional() @IsBoolean() installationIncluded?: boolean;
  @IsOptional() @IsString() vatStatus?: string;
  @IsOptional() @IsNumber() examplePriceAmount?: number;
  @IsOptional() @IsString() examplePriceUnit?: string;
  @IsOptional() @IsString() examplePriceNotes?: string;
}

export class VendorServiceAreaInputDto {
  @IsOptional() @IsString() locationKey?: string;
  @IsOptional() @IsString() stateKey?: string;
  @IsOptional() @IsString() stateLabel?: string;
  @IsOptional() @IsString() cityKey?: string;
  @IsOptional() @IsString() cityLabel?: string;
  @IsOptional() @IsString() coverageType?: string;
  @IsOptional() @IsString() notes?: string;
}

export class VendorRepresentativeInputDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(80) role?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() showPublicly?: boolean;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class VendorDocumentInputDto {
  @IsEnum(VendorDocumentType) documentType!: VendorDocumentType;
  @IsString() fileRef!: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsInt() fileSizeBytes?: number;
  @IsOptional() @IsString() contentHash?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

export class PublicVendorSearchDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() familyKey?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() stateKey?: string;
  @IsOptional() @IsString() cityKey?: string;
  @IsOptional() @IsString() localAreaKey?: string;
  @IsOptional() @IsString() deliveryStateKey?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) verifiedOnly?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) retail?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) wholesale?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) delivery?: boolean;
  @IsOptional() @IsIn(['best', 'name']) sort?: 'best' | 'name';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 20;
}

export class ApplyVendorDto {
  @IsString() @MinLength(2) @MaxLength(160) tradingName!: string;
  @IsOptional() @IsString() @MaxLength(160) legalName?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsInt() @Min(1900) @Max(2100) yearEstablished?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) businessTypes?: string[];
  @IsOptional() @IsString() logoUrl?: string;

  @IsOptional() @IsString() stateKey?: string;
  @IsOptional() @IsString() stateLabel?: string;
  @IsOptional() @IsString() cityKey?: string;
  @IsOptional() @IsString() cityLabel?: string;
  @IsOptional() @IsString() lgaLabel?: string;
  @IsOptional() @IsString() publicAddress?: string;
  @IsOptional() @IsString() privateBusinessAddress?: string;
  @IsOptional() @IsEnum(VendorAddressVisibility) addressVisibility?: VendorAddressVisibility;

  @IsOptional() @IsString() publicPhone?: string;
  @IsOptional() @IsString() publicWhatsApp?: string;
  @IsOptional() @IsEmail() publicEmail?: string;
  @IsOptional() @IsBoolean() showPublicPhone?: boolean;
  @IsOptional() @IsBoolean() showPublicWhatsApp?: boolean;
  @IsOptional() @IsBoolean() showPublicEmail?: boolean;
  @IsOptional() @IsUrl({ require_protocol: true }) websiteUrl?: string;
  @IsOptional() @IsObject() socialLinks?: Record<string, string>;
  @IsOptional() @IsEnum(VendorPreferredContactMethod) preferredContactMethod?: VendorPreferredContactMethod;
  @IsOptional() @IsString() salesContactName?: string;
  @IsOptional() @IsString() quotationEmail?: string;
  @IsOptional() @IsString() businessHours?: string;

  @IsOptional() @IsBoolean() acceptsSmallOrders?: boolean;
  @IsOptional() @IsBoolean() acceptsBulkOrders?: boolean;
  @IsOptional() @IsBoolean() acceptsProjectQuotations?: boolean;
  @IsOptional() @IsBoolean() canSupplyBoqQuotations?: boolean;
  @IsOptional() @IsBoolean() canSourceUnstocked?: boolean;
  @IsOptional() @IsBoolean() deliveryFleetAvailable?: boolean;
  @IsOptional() @IsBoolean() thirdPartyDelivery?: boolean;
  @IsOptional() @IsBoolean() pickupAvailable?: boolean;
  @IsOptional() @IsBoolean() interstateDelivery?: boolean;
  @IsOptional() @IsBoolean() nationwideDelivery?: boolean;
  @IsOptional() @IsBoolean() installationAvailable?: boolean;
  @IsOptional() @IsBoolean() afterSalesSupport?: boolean;
  @IsOptional() @IsBoolean() warrantyHandling?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) paymentMethodsAccepted?: string[];
  @IsOptional() @IsBoolean() depositRequired?: boolean;
  @IsOptional() @IsBoolean() pricesNegotiable?: boolean;
  @IsOptional() @IsBoolean() priceListAvailable?: boolean;
  @IsOptional() @IsString() priceListUrl?: string;
  @IsOptional() @IsInt() typicalQuoteResponseHours?: number;

  @IsOptional() @IsString() cacRegistrationStatus?: string;
  @IsOptional() @IsString() cacNumber?: string;
  @IsOptional() @IsString() taxIdentificationNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorOfferingInputDto)
  offerings?: VendorOfferingInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorServiceAreaInputDto)
  serviceAreas?: VendorServiceAreaInputDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => VendorRepresentativeInputDto)
  representative?: VendorRepresentativeInputDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorDocumentInputDto)
  documents?: VendorDocumentInputDto[];

  @IsBoolean() accuracyConfirmed!: boolean;
  @IsBoolean() contactConsent!: boolean;
  @IsBoolean() publicDisplayConsent!: boolean;
  @IsBoolean() noGuaranteeAcknowledged!: boolean;
}

export class VendorQuoteRequestDto {
  @IsString() @MinLength(2) @MaxLength(200) product!: string;
  @IsOptional() @IsString() @MaxLength(2000) specification?: string;
  @IsOptional() @IsString() @MaxLength(120) quantity?: string;
  @IsOptional() @IsString() @MaxLength(200) deliveryLocation?: string;
  @IsString() @MinLength(2) @MaxLength(120) buyerName!: string;
  @IsOptional() @IsEmail() buyerEmail?: string;
  @IsOptional() @IsString() buyerPhone?: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

export class AdminVendorSearchDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsEnum(VendorListingStatus) listingStatus?: VendorListingStatus;
  @IsOptional() @IsEnum(VendorVerificationStatus) verificationStatus?: VendorVerificationStatus;
  @IsOptional() @IsEnum(VendorProcurementRelationship) procurementRelationship?: VendorProcurementRelationship;
  @IsOptional() @IsEnum(VendorAcquisitionSource) acquisitionSource?: VendorAcquisitionSource;
  @IsOptional() @IsString() familyKey?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() stateKey?: string;
  @IsOptional() @IsString() deliveryStateKey?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) wholesale?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) previouslyUsed?: boolean;
  @IsOptional() @IsEnum(VendorClaimStatus) claimStatus?: VendorClaimStatus;
  @IsOptional() @IsIn(['never', 'older_than_7', 'older_than_30', 'older_than_90'])
  lastContacted?: 'never' | 'older_than_7' | 'older_than_30' | 'older_than_90';
  @IsOptional() @IsBoolean() @Type(() => Boolean) emailBounced?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) completenessMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) completenessMax?: number;
  @IsOptional() @IsString() localAreaKey?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) needsDataCleanup?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 30;
}

export class AdminVendorProductDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(160) spec?: string;
  @IsOptional() @IsString() @MaxLength(40) unit?: string;
  @IsOptional() @IsString() @MaxLength(80) brand?: string;
}

export class AdminCreateVendorDto {
  @IsString() @MinLength(2) @MaxLength(160) tradingName!: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsInt() @Min(1800) yearEstablished?: number;
  @IsOptional() @ValidateIf((_, value) => value !== '' && value != null) @IsUrl({ require_protocol: true }) websiteUrl?: string;
  @IsOptional() @IsEmail() quotationEmail?: string;
  @IsOptional() @IsString() salesContactName?: string;
  @IsOptional() @IsString() localAreaLabel?: string;
  @IsOptional() @IsString() localAreaKey?: string;
  @IsOptional() @IsString() publicAddress?: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsString() privateBusinessAddress?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsIn(['not_confirmed', 'delivers', 'pickup_only']) deliveryStatus?: 'not_confirmed' | 'delivers' | 'pickup_only';
  @IsOptional() @IsString() primaryFamilyKey?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(5) @IsString({ each: true }) secondaryFamilyKeys?: string[];
  @IsOptional() @IsBoolean() sellsRetail?: boolean;
  @IsOptional() @IsBoolean() sellsWholesale?: boolean;
  @IsOptional() @IsString() cacNumber?: string;
  @IsOptional() @IsString() cacRegisteredName?: string;
  @IsOptional() @IsIn(['active', 'inactive', 'unknown']) cacRegistryStatus?: 'active' | 'inactive' | 'unknown';
  @IsOptional() @IsString() cacRegisteredOn?: string;
  @IsOptional() @IsString() cacCheckedVia?: string;
  @IsOptional() @IsString() cacCheckedAt?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AdminVendorProductDto) products?: AdminVendorProductDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VendorServiceAreaInputDto) serviceAreas?: VendorServiceAreaInputDto[];
  @IsOptional() @IsString() publicPhone?: string;
  @IsOptional() @IsString() publicWhatsApp?: string;
  @IsOptional() @IsEmail() publicEmail?: string;
  @IsOptional() @IsString() stateKey?: string;
  @IsOptional() @IsString() stateLabel?: string;
  @IsOptional() @IsString() cityLabel?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) businessTypes?: string[];
  @IsOptional() @IsEnum(VendorAcquisitionSource) acquisitionSource?: VendorAcquisitionSource;
  @IsOptional() @IsString() acquisitionNote?: string;
  @IsOptional() @IsString() internalNote?: string;
  @IsOptional() @IsBoolean() saveAsInternalOnly?: boolean;
  @IsOptional()
  @ValidateNested()
  @Type(() => VendorRepresentativeInputDto)
  representative?: VendorRepresentativeInputDto;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorOfferingInputDto)
  offerings?: VendorOfferingInputDto[];
}

export class AdminUpdateVendorDto {
  @IsOptional() @IsString() tradingName?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsInt() yearEstablished?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) businessTypes?: string[];
  @IsOptional() @IsString() publicPhone?: string;
  @IsOptional() @IsString() publicWhatsApp?: string;
  @IsOptional() @IsEmail() publicEmail?: string;
  @IsOptional() @IsBoolean() showPublicPhone?: boolean;
  @IsOptional() @IsBoolean() showPublicWhatsApp?: boolean;
  @IsOptional() @IsBoolean() showPublicEmail?: boolean;
  @IsOptional() @ValidateIf((_, value) => value !== '' && value != null) @IsUrl({ require_protocol: true }) websiteUrl?: string;
  @IsOptional() @IsObject() socialLinks?: Record<string, string>;
  @IsOptional() @IsEnum(VendorPreferredContactMethod) preferredContactMethod?: VendorPreferredContactMethod;
  @IsOptional() @IsString() salesContactName?: string;
  @IsOptional() @IsString() procurementContactName?: string;
  @IsOptional() @IsEmail() quotationEmail?: string;
  @IsOptional() @IsString() businessHours?: string;
  @IsOptional() @IsBoolean() afterHoursAvailable?: boolean;
  @IsOptional() @IsString() stateKey?: string;
  @IsOptional() @IsString() stateLabel?: string;
  @IsOptional() @IsString() cityKey?: string;
  @IsOptional() @IsString() cityLabel?: string;
  @IsOptional() @IsString() lgaLabel?: string;
  @IsOptional() @IsString() publicAddress?: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsString() localAreaLabel?: string;
  @IsOptional() @IsString() localAreaKey?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsIn(['not_confirmed', 'delivers', 'pickup_only']) deliveryStatus?: 'not_confirmed' | 'delivers' | 'pickup_only';
  @IsOptional() @IsString() primaryFamilyKey?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(5) @IsString({ each: true }) secondaryFamilyKeys?: string[];
  @IsOptional() @IsString() privateBusinessAddress?: string;
  @IsOptional() @IsEnum(VendorAddressVisibility) addressVisibility?: VendorAddressVisibility;
  @IsOptional() @IsBoolean() acceptsSmallOrders?: boolean;
  @IsOptional() @IsBoolean() acceptsBulkOrders?: boolean;
  @IsOptional() @IsBoolean() acceptsProjectQuotations?: boolean;
  @IsOptional() @IsBoolean() canSupplyBoqQuotations?: boolean;
  @IsOptional() @IsBoolean() canSourceUnstocked?: boolean;
  @IsOptional() @IsBoolean() deliveryFleetAvailable?: boolean;
  @IsOptional() @IsBoolean() thirdPartyDelivery?: boolean;
  @IsOptional() @IsBoolean() pickupAvailable?: boolean;
  @IsOptional() @IsBoolean() interstateDelivery?: boolean;
  @IsOptional() @IsBoolean() nationwideDelivery?: boolean;
  @IsOptional() @IsBoolean() installationAvailable?: boolean;
  @IsOptional() @IsBoolean() afterSalesSupport?: boolean;
  @IsOptional() @IsBoolean() warrantyHandling?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) paymentMethodsAccepted?: string[];
  @IsOptional() @IsBoolean() depositRequired?: boolean;
  @IsOptional() @IsString() creditTermsNotes?: string;
  @IsOptional() @IsBoolean() pricesNegotiable?: boolean;
  @IsOptional() @IsBoolean() priceListAvailable?: boolean;
  @IsOptional() @IsString() priceListUrl?: string;
  @IsOptional() @IsInt() typicalQuoteResponseHours?: number;
  @IsOptional() @IsString() cacRegistrationStatus?: string;
  @IsOptional() @IsString() cacNumber?: string;
  @IsOptional() @IsString() cacRegisteredName?: string;
  @IsOptional() @IsIn(['active', 'inactive', 'unknown']) cacRegistryStatus?: 'active' | 'inactive' | 'unknown';
  @IsOptional() @IsString() cacRegisteredOn?: string;
  @IsOptional() @IsString() cacCheckedVia?: string;
  @IsOptional() @IsString() cacCheckedAt?: string;
  @IsOptional() @IsString() taxIdentificationNumber?: string;
  @IsOptional() @IsString() bankAccountName?: string;
  @IsOptional() @IsEnum(VendorProcurementRelationship) procurementRelationship?: VendorProcurementRelationship;
  @IsOptional() @IsBoolean() previouslyUsedByBmh?: boolean;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorOfferingInputDto)
  offerings?: VendorOfferingInputDto[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorServiceAreaInputDto)
  serviceAreas?: VendorServiceAreaInputDto[];
  @IsOptional()
  @ValidateNested()
  @Type(() => VendorRepresentativeInputDto)
  representative?: VendorRepresentativeInputDto;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AdminVendorProductDto) products?: AdminVendorProductDto[];
}

export class AdminBulkVendorActionDto {
  @IsIn(['set_category', 'send_claim_invites', 'set_listing_status'])
  action!: 'set_category' | 'send_claim_invites' | 'set_listing_status';
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) ids!: string[];
  @IsBoolean() confirm!: boolean;
  @IsOptional() @IsString() primaryFamilyKey?: string;
  @IsOptional() @IsEnum(VendorListingStatus) listingStatus?: VendorListingStatus;
}

export class AdminReviewActionDto {
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @IsOptional() @IsString() @MaxLength(2000) clarificationMessage?: string;
}

export class AdminVerificationCheckDto {
  @IsEnum(VendorVerificationCheckKey) checkKey!: VendorVerificationCheckKey;
  @IsEnum(VendorVerificationCheckStatus) status!: VendorVerificationCheckStatus;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() failureReason?: string;
  @IsOptional() @IsString() evidenceDocumentId?: string;
  @IsOptional() @IsString() expiresAt?: string;
}

export class AdminUpsertVerificationChecksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminVerificationCheckDto)
  checks!: AdminVerificationCheckDto[];
  @IsOptional() @IsBoolean() markVerifiedIfReady?: boolean;
}

export class AdminNoteDto {
  @IsString() @MinLength(1) @MaxLength(5000) body!: string;
}

export class AdminActivityDto {
  @IsEnum(VendorActivityType) type!: VendorActivityType;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() projectId?: string;
}

export class AdminClaimInviteDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(30) expiresInDays?: number;
}

export class VendorManageUpdateDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() businessHours?: string;
  @IsOptional() @IsString() publicPhone?: string;
  @IsOptional() @IsString() publicWhatsApp?: string;
  @IsOptional() @IsEmail() publicEmail?: string;
  @IsOptional() @IsBoolean() showPublicPhone?: boolean;
  @IsOptional() @IsBoolean() showPublicWhatsApp?: boolean;
  @IsOptional() @IsBoolean() showPublicEmail?: boolean;
  @IsOptional() @IsUrl({ require_protocol: true }) websiteUrl?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsObject() socialLinks?: Record<string, string>;
  @IsOptional() @IsArray() @IsString({ each: true }) paymentMethodsAccepted?: string[];
  @IsOptional() @IsBoolean() pricesNegotiable?: boolean;
  @IsOptional() @IsBoolean() pickupAvailable?: boolean;
  @IsOptional() @IsBoolean() interstateDelivery?: boolean;
  @IsOptional() @IsBoolean() nationwideDelivery?: boolean;
  @IsOptional() @IsBoolean() installationAvailable?: boolean;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorOfferingInputDto)
  offerings?: VendorOfferingInputDto[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorServiceAreaInputDto)
  serviceAreas?: VendorServiceAreaInputDto[];
}

export class VendorSensitiveChangeDto {
  @IsString() fieldGroup!: string;
  @IsObject() proposedPayload!: Record<string, unknown>;
}

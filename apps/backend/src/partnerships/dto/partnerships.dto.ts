import { FollowUpStep, LeadSourceType, LeadTemperature, PartnerCategory, PartnershipMeetingStatus, PartnershipStage, TouchChannel, TouchDirection, TouchKind, TouchOutcome } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class LeadContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  linkedinUrl?: string;

  @IsOptional()
  @IsBoolean()
  isDecisionMaker?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  doNotContact?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  doNotContactReason?: string;
}

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName!: string;

  @IsEnum(PartnerCategory)
  category!: PartnerCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  groupName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  whyTheyMatter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  whatWeKnow?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  suspectedProblem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  exactNextAction?: string;

  @IsOptional()
  @IsEnum(LeadTemperature)
  temperature?: LeadTemperature;

  @IsEnum(LeadSourceType)
  sourceType!: LeadSourceType;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourceDetail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsBoolean()
  createAnyway?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LeadContactDto)
  contact?: LeadContactDto;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsEnum(PartnerCategory)
  category?: PartnerCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  groupName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  whyTheyMatter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  whatWeKnow?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  suspectedProblem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  exactNextAction?: string;

  @IsOptional()
  @IsEnum(LeadTemperature)
  temperature?: LeadTemperature;

  @IsOptional()
  @IsDateString()
  nextFollowUpOverride?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;
}

export class ChangeStageDto {
  @IsEnum(PartnershipStage)
  toStage!: PartnershipStage;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class LogTouchDto {
  @IsOptional()
  @IsString()
  contactId?: string;

  @IsEnum(TouchChannel)
  channel!: TouchChannel;

  @IsEnum(TouchDirection)
  direction!: TouchDirection;

  @IsEnum(TouchKind)
  kind!: TouchKind;

  @IsOptional()
  @IsEnum(TouchOutcome)
  outcome?: TouchOutcome;

  @IsDateString()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  summary?: string;

  @IsOptional()
  @IsEnum(FollowUpStep)
  nextStep?: FollowUpStep;

  @IsOptional()
  @IsDateString()
  nextFollowUpOverride?: string;

  @IsOptional()
  @IsEnum(PartnershipStage)
  toStage?: PartnershipStage;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fromMailbox?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  toAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  emailSubject?: string;

  @IsOptional()
  @IsBoolean()
  override?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CreateMeetingDto {
  @IsOptional()
  @IsString()
  contactId?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  meetLink?: string;
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsEnum(PartnershipMeetingStatus)
  status?: PartnershipMeetingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  outcome?: string;
}

export class LinkPartnerDto {
  @IsOptional()
  @IsString()
  referrerId?: string | null;
}

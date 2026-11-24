import { IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

export class CreateReferrerDto {
  @IsIn(['referrer', 'affiliate'])
  type!: 'referrer' | 'affiliate';

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

export class UpdateReferrerDto {
  @IsOptional()
  @IsIn(['referrer', 'affiliate'])
  type?: 'referrer' | 'affiliate';

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class UpdateReferralProgramDto {
  @IsOptional()
  @IsBoolean()
  allowHomeownerTypedCode?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  linkValidityDays?: number;

  @IsOptional()
  @IsIn(['first_touch', 'latest_code'])
  attributionRule?: 'first_touch' | 'latest_code';

  @IsOptional()
  @IsBoolean()
  trackVendors?: boolean;

  @IsOptional()
  @IsIn(['undecided', 'listing', 'job_created', 'job_paid', 'job_completed'])
  countsWhen?: 'undecided' | 'listing' | 'job_created' | 'job_paid' | 'job_completed';

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  payoutRules?: string;

  @IsOptional()
  @IsBoolean()
  leaderboardShowRealNames?: boolean;
}

export class AttachReferrerDto {
  @IsIn(['project', 'artisan_listing', 'professional_listing', 'vendor'])
  targetType!: 'project' | 'artisan_listing' | 'professional_listing' | 'vendor';

  @IsUUID()
  targetId!: string;

  @IsOptional()
  @IsUUID()
  referrerId?: string | null;
}

export class RecordReferralClickDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  landingPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  campaignSlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  anonymousId?: string;
}

export class LockReferralDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @IsIn(['link', 'code_entered'])
  source?: 'link' | 'code_entered';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  anonymousId?: string;
}

export class ApplyAffiliateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

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
  @MaxLength(240)
  audience?: string;
}

export class PartnerLoginDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;
}

export class PartnerLoginConsumeDto {
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token!: string;
}

export class PublishReferralRuleDto {
  @IsIn(['affiliate', 'referrer'])
  program!: 'affiliate' | 'referrer';

  @IsOptional()
  @IsBoolean()
  publish?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  rateBps?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  clickWindowDays?: number;

  @IsOptional()
  @IsIn(['percent', 'fixed', 'unpublished'])
  rewardKind?: 'percent' | 'fixed' | 'unpublished';

  @IsOptional()
  @IsInt()
  @Min(1)
  fixedRewardNaira?: number;
}

export class CommissionDecisionDto {
  @IsOptional()
  @IsBoolean()
  override?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class UpdatePartnerSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

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
  @MaxLength(120)
  accountName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxId?: string;

  @IsOptional()
  @IsBoolean()
  notifyEarnings?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => String(value || '').trim().length > 0)
  @Matches(/^[A-Za-z0-9 ]{2,24}$/, { message: 'Use 2 to 24 letters, numbers or spaces.' })
  @MaxLength(24)
  leaderboardNickname?: string;

  @IsOptional()
  @IsBoolean()
  leaderboardHidden?: boolean;
}

export class SaveLibraryItemDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsIn(['post', 'video', 'image'])
  kind!: 'post' | 'video' | 'image';

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(240)
  audience!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(600)
  problem!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(600)
  promise!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  caption!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  assetUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  destinationPath?: string;

  @IsOptional()
  @ValidateIf((_, value) => String(value || '').length > 0)
  @IsIn(['word_of_mouth', 'online'])
  placement?: string;

  @IsBoolean()
  publish!: boolean;
}

export class LibraryStatusDto {
  @IsIn(['draft', 'approved'])
  status!: 'draft' | 'approved';
}

export class SaveSkitIdeaDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  whoFilms?: string;

  @IsIn(['skit', 'alternative'])
  format!: 'skit' | 'alternative';

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  script!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  caption!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class SkitIdeaStatusDto {
  @IsIn(['active', 'retired'])
  status!: 'active' | 'retired';
}

export class SaveBmhPostDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsIn(['instagram', 'tiktok', 'google_business', 'x'])
  platform!: 'instagram' | 'tiktok' | 'google_business' | 'x';

  @IsString()
  @MaxLength(500)
  url!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(160)
  summary!: string;

  @IsDateString()
  postedAt!: string;
}

export class BmhPostStatusDto {
  @IsIn(['published', 'hidden'])
  status!: 'published' | 'hidden';
}

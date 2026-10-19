import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

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

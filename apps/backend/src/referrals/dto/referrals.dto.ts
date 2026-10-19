import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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

export class AttachReferrerDto {
  @IsIn(['project', 'artisan_listing', 'professional_listing'])
  targetType!: 'project' | 'artisan_listing' | 'professional_listing';

  @IsUUID()
  targetId!: string;

  @IsOptional()
  @IsUUID()
  referrerId?: string | null;
}

import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum AdminEmailAudience {
  ALL_USERS = 'all_users',
  ALL_GCS = 'all_gcs',
  ALL_HOMEOWNERS = 'all_homeowners',
  SPECIFIC_USERS = 'specific_users',
}

export class SendBulkEmailDto {
  @IsEnum(AdminEmailAudience)
  audience: AdminEmailAudience;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  recipients?: string[];
}


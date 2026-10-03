import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateJoinRequestDto {
  @IsIn(['repairs', 'cleaning', 'builders', 'professional', 'materials'])
  path!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(12000)
  answersJson!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @Matches(/^\+[1-9]\d{7,14}$/)
  whatsapp!: string;

  @IsBoolean()
  termsAcknowledged!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  termsVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  utmJson?: string;

  @IsOptional()
  @IsString()
  companyFax?: string;
}

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ProjectType } from '@prisma/client';

export class CreateManagedProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsNumber()
  @Min(0)
  budget: number;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  stages?: Array<{
    name: string;
    estimatedCost: number;
    estimatedDuration: string;
  }>;

  @IsString()
  @IsNotEmpty()
  homeownerName: string;

  @IsEmail()
  homeownerEmail: string;

  @IsOptional()
  @IsString()
  homeownerPhone?: string;

  @IsString()
  @IsNotEmpty()
  gcName: string;

  @IsEmail()
  gcEmail: string;

  @IsOptional()
  @IsString()
  gcPhone?: string;

  @IsOptional()
  @IsUUID()
  existingGcUserId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;
}

export class RequestAccessCodeDto {
  @IsEmail()
  email: string;
}

export class VerifyAccessCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  acceptTerms?: boolean;
}

export class ClaimAccessRegisterDto {
  @IsOptional()
  @IsString()
  accessToken?: string;
}

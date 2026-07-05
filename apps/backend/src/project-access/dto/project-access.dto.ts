import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectType } from '@prisma/client';

export class ManagedProjectPhaseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  estimatedDuration: string;

  @IsNumber()
  @Min(0)
  estimatedCost: number;
}

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
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scopeSummary?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsString()
  projectTypeTag?: 'repair' | 'upgrades' | 'renovation' | 'full_builds';

  @IsOptional()
  @IsString()
  projectTypeFilter?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  squareFootage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  floors?: number;

  @IsOptional()
  @IsString()
  estimatedDuration?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rooms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  /** Legacy template support — prefer constructionPhases from admin scope form. */
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManagedProjectPhaseDto)
  stages?: ManagedProjectPhaseDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ManagedProjectPhaseDto)
  constructionPhases: ManagedProjectPhaseDto[];

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

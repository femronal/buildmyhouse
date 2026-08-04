import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CANDIDATE_STAGES } from '../permissions/permission-catalog';

const WORKFORCE_TYPES = [
  'employee',
  'fixed_term',
  'consultant',
  'independent_contractor',
  'intern',
  'freelancer',
  'executive',
  'temporary',
] as const;

const EMPLOYMENT_STATUSES = [
  'onboarding',
  'active',
  'probation',
  'leave',
  'suspended',
  'exited',
] as const;

export class CreateCandidateDto {
  @IsString() @MinLength(1) firstName!: string;
  @IsString() @MinLength(1) lastName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @IsString() cvUrl?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsIn([...CANDIDATE_STAGES]) stage?: string;
  @IsOptional() @IsUUID() hiringManagerUserId?: string;
  @IsOptional() @IsString() internalNotes?: string;
}

export class UpdateCandidateDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsUUID() departmentId?: string | null;
  @IsOptional() @IsUUID() positionId?: string | null;
  @IsOptional() @IsString() cvUrl?: string | null;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsUUID() hiringManagerUserId?: string | null;
  @IsOptional() @IsDateString() interviewDate?: string | null;
  @IsOptional() @IsString() interviewNotes?: string;
  @IsOptional() @IsNumber() interviewScore?: number | null;
  @IsOptional() @IsString() assessmentInstructions?: string;
  @IsOptional() @IsString() assessmentSubmission?: string;
  @IsOptional() @IsNumber() assessmentScore?: number | null;
  @IsOptional() @IsString() pilotNotes?: string;
  @IsOptional() referencesJson?: unknown;
  @IsOptional() @IsString() referenceCheckNotes?: string;
  @IsOptional() @IsString() offerDetails?: string;
  @IsOptional() @IsString() rejectionReason?: string;
  @IsOptional() @IsString() internalNotes?: string;
}

export class ChangeCandidateStageDto {
  @IsIn([...CANDIDATE_STAGES]) stage!: string;
  @IsOptional() @IsString() note?: string;
}

export class HireCandidateDto {
  @IsIn([...WORKFORCE_TYPES]) workforceType!: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() probationEndDate?: string;
  @IsOptional() @IsUUID() managerUserId?: string;
  @IsOptional() @IsBoolean() createLogin?: boolean;
  @IsOptional() @IsString() @MinLength(6) temporaryPassword?: string;
  @IsOptional() @IsBoolean() enableDashboardAccess?: boolean;
  @IsOptional() @IsUUID() adminRoleId?: string;
  @IsOptional() @IsNumber() baseCompensation?: number;
  @IsOptional() @IsString() paymentFrequency?: string;
}

export class CreateStaffDto {
  @IsString() @MinLength(1) firstName!: string;
  @IsString() @MinLength(1) lastName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() pictureUrl?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() emergencyContact?: string;
  @IsOptional() @IsString() emergencyPhone?: string;
  @IsIn([...WORKFORCE_TYPES]) workforceType!: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @IsUUID() managerUserId?: string;
  @IsOptional() @IsString() workLocation?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsDateString() probationEndDate?: string;
  @IsOptional() @IsIn([...EMPLOYMENT_STATUSES]) employmentStatus?: string;
  @IsOptional() @IsNumber() baseCompensation?: number;
  @IsOptional() @IsNumber() transportAllowance?: number;
  @IsOptional() @IsNumber() communicationAllowance?: number;
  @IsOptional() @IsNumber() otherAllowances?: number;
  @IsOptional() @IsString() bonusNotes?: string;
  @IsOptional() @IsString() paymentFrequency?: string;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}

export class OffboardStaffDto {
  @IsDateString() exitDate!: string;
  @IsOptional() @IsString() exitReason?: string;
  @IsOptional() @IsString() finalHandoverNotes?: string;
  @IsOptional() @IsBoolean() companyPropertyReturned?: boolean;
  @IsOptional() @IsBoolean() disableAccount?: boolean;
  @IsOptional() @IsBoolean() revokePermissions?: boolean;
  @IsOptional() @IsBoolean() archiveDocuments?: boolean;
  @IsOptional() @IsString() exitNotes?: string;
}

export class UpdateOnboardingTaskDto {
  @IsIn(['pending', 'completed', 'waived']) status!: string;
}

export class CreateDepartmentDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() headUserId?: string;
}

export class UpdateDepartmentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() headUserId?: string | null;
  @IsOptional() @IsBoolean() archive?: boolean;
}

export class CreatePositionDto {
  @IsUUID() departmentId!: string;
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() purpose?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) responsibilities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) requiredSkills?: string[];
  @IsOptional() @IsUUID() reportsToPositionId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) allowedWorkforceTypes?: string[];
  @IsOptional() kpiDefinitions?: unknown;
  @IsOptional() @IsNumber() compensationMin?: number;
  @IsOptional() @IsNumber() compensationMax?: number;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdatePositionDto {
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() purpose?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) responsibilities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) requiredSkills?: string[];
  @IsOptional() @IsUUID() reportsToPositionId?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) allowedWorkforceTypes?: string[];
  @IsOptional() kpiDefinitions?: unknown;
  @IsOptional() @IsNumber() compensationMin?: number | null;
  @IsOptional() @IsNumber() compensationMax?: number | null;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateDocumentDto {
  @IsString() category!: string;
  @IsString() fileUrl!: string;
  @IsOptional() @IsString() fileName?: string;
  @IsOptional() @IsUUID() staffProfileId?: string;
  @IsOptional() @IsUUID() candidateId?: string;
  @IsOptional() @IsDateString() effectiveDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsIn(['unsigned', 'pending', 'signed']) signatureStatus?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePolicyDto {
  @IsString() @MinLength(1) title!: string;
  @IsString() category!: string;
  @IsString() @MinLength(1) content!: string;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsDateString() effectiveDate?: string;
  @IsOptional() @IsIn(['draft', 'active', 'archived']) status?: string;
  @IsOptional() @IsBoolean() appliesCompanyWide?: boolean;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) departmentIds?: string[];
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) positionIds?: string[];
}

export class UpdatePolicyDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsDateString() effectiveDate?: string | null;
  @IsOptional() @IsIn(['draft', 'active', 'archived']) status?: string;
  @IsOptional() @IsBoolean() appliesCompanyWide?: boolean;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) departmentIds?: string[];
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) positionIds?: string[];
}

export class AcknowledgePolicyDto {
  @IsUUID() staffProfileId!: string;
}

export class CreatePerformanceGoalDto {
  @IsUUID() staffProfileId!: string;
  @IsString() kpi!: string;
  @IsString() target!: string;
  @IsString() period!: string;
  @IsOptional() @IsString() actualResult?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() managerComments?: string;
  @IsOptional() @IsString() reviewType?: string;
  @IsOptional() @IsString() bonusEligibleNotes?: string;
}

export class UpdatePerformanceGoalDto {
  @IsOptional() @IsString() kpi?: string;
  @IsOptional() @IsString() target?: string;
  @IsOptional() @IsString() period?: string;
  @IsOptional() @IsString() actualResult?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() managerComments?: string;
  @IsOptional() @IsString() reviewType?: string;
  @IsOptional() @IsString() bonusEligibleNotes?: string;
}

export class SendHrCommunicationDto {
  @IsEmail() recipientEmail!: string;
  @IsOptional() @IsString() templateKey?: string;
  @IsOptional() @IsString() @MaxLength(200) subject?: string;
  @IsOptional() @IsString() bodyText?: string;
  @IsOptional() @IsString() bodyHtml?: string;
  @IsOptional() @IsUUID() candidateId?: string;
  @IsOptional() @IsUUID() staffProfileId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() position?: string;
}

export class UpsertAdminRoleDto {
  @IsString() @MinLength(1) key!: string;
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @IsString({ each: true }) permissionKeys!: string[];
}

export class AssignStaffRoleDto {
  @IsUUID() roleId!: string;
}

export class CreateStaffLoginDto {
  @IsString() @MinLength(6) temporaryPassword!: string;
  @IsOptional() @IsBoolean() enableDashboardAccess?: boolean;
  @IsOptional() @IsUUID() adminRoleId?: string;
}

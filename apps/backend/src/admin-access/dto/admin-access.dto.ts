import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { ACCESS_RELATIONSHIPS } from '../../hr/permissions/permission-catalog';

export class GrantAccessDto {
  @IsIn(['staff', 'external'])
  mode!: 'staff' | 'external';

  @IsOptional()
  @IsUUID()
  staffProfileId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  organisation?: string;

  @IsIn([...ACCESS_RELATIONSHIPS])
  accessRelationship!: string;

  @IsOptional()
  @IsString()
  accessReason?: string;

  @IsOptional()
  @IsUUID()
  sponsorUserId?: string;

  @IsString()
  @MinLength(1)
  roleKey!: string;

  @IsOptional()
  @IsDateString()
  accessStartsAt?: string;

  @IsOptional()
  @IsDateString()
  accessExpiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  temporaryDays?: number;

  @IsOptional()
  @IsBoolean()
  sendInvite?: boolean;

  /** Optional legacy: set password immediately and force reset. */
  @IsOptional()
  @IsString()
  @MinLength(6)
  temporaryPassword?: string;
}

export class UpdateAccessDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  roleKey?: string;

  @IsOptional()
  @IsIn([...ACCESS_RELATIONSHIPS])
  accessRelationship?: string;

  @IsOptional()
  @IsString()
  accessReason?: string;

  @IsOptional()
  @IsString()
  organisation?: string;

  @IsOptional()
  @IsDateString()
  accessExpiresAt?: string | null;

  @IsOptional()
  @IsUUID()
  staffProfileId?: string | null;

  @IsOptional()
  @IsUUID()
  sponsorUserId?: string | null;
}

export class SuspendAccessDto {
  @IsString()
  @MinLength(1)
  reason!: string;

  @IsOptional()
  @IsDateString()
  until?: string;
}

export class RevokeAccessDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}

export class RestoreAccessDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class OverridePermissionDto {
  @IsString()
  @MinLength(1)
  permissionKey!: string;

  @IsIn(['grant', 'deny'])
  effect!: 'grant' | 'deny';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RemoveOverrideDto {
  @IsString()
  @MinLength(1)
  permissionKey!: string;

  @IsIn(['grant', 'deny'])
  effect!: 'grant' | 'deny';
}

export class UpsertRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  key?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  permissionKeys!: string[];
}

export class DecideAccessRequestDto {
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAccessRequestDto {
  @IsString()
  @MinLength(1)
  permissionKey!: string;

  @IsString()
  @MinLength(1)
  businessReason!: string;

  @IsOptional()
  @IsString()
  requestedDuration?: string;
}

export class AcceptInviteDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;
}

export class ExtendAccessDto {
  @IsDateString()
  accessExpiresAt!: string;
}

export class LinkStaffProfileDto {
  @IsUUID()
  staffProfileId!: string;
}

export class AssignRoleDto {
  @IsString()
  @MinLength(1)
  roleKey!: string;
}

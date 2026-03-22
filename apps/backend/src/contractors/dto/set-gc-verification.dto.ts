import { IsBoolean, IsOptional } from 'class-validator';

export class SetGCVerificationDto {
  @IsBoolean()
  verified!: boolean;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}


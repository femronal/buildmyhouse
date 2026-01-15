import { IsString, IsOptional, IsNumber, IsEmail, IsEnum } from 'class-validator';

export class CreateStageTeamMemberDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  dailyRate?: number;

  @IsOptional()
  @IsEnum(['daily', 'hourly', 'fixed'])
  rateType?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}



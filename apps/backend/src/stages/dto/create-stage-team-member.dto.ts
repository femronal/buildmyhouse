import { IsString, IsOptional, IsNumber, IsEmail, IsEnum, IsIn, IsDateString } from 'class-validator';
import { LINE_STATUSES, PAID_BY } from '../../projects/job-money';

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
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(LINE_STATUSES)
  payStatus?: string;

  @IsOptional()
  @IsNumber()
  paidAmount?: number | null;

  @IsOptional()
  @IsDateString()
  paidAt?: string | null;

  @IsOptional()
  @IsIn(PAID_BY)
  paidBy?: string | null;

  @IsOptional()
  @IsString()
  hoPaymentRef?: string | null;

  @IsOptional()
  @IsString()
  payoutOverrideNote?: string;
}

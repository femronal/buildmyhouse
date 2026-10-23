import { IsString, IsOptional, IsNumber, IsIn, IsDateString } from 'class-validator';
import { PAYEE_KINDS, LINE_STATUSES } from '../../projects/job-money';

export class CreateStageMaterialDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string; // 'kg' | 'bags' | 'pieces' | 'liters' | 'meters' | 'tonnes' | etc.

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  supplierContact?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsIn(PAYEE_KINDS)
  payeeKind: string;

  @IsOptional()
  @IsIn(LINE_STATUSES)
  status?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string | null;

  @IsOptional()
  @IsString()
  hoPaymentRef?: string | null;
}

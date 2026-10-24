import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ConfirmManualPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  /**
   * Optional admin note for audit/debugging. Not currently persisted.
   * Kept for forward-compat if we later store a confirmation note.
   */
  @IsOptional()
  @IsString()
  @MinLength(1)
  note?: string;
}


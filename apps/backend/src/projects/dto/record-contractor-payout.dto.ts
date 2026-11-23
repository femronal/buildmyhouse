import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RecordContractorPayoutDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  bankReference: string;

  @IsString()
  @IsNotEmpty()
  proofFileUrl: string;

  @IsDateString()
  sentAt: string;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  earlyPaymentReason?: string;
}

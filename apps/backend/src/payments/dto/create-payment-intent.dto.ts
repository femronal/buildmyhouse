import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  stageId?: string;

  @IsString()
  currency: string = 'usd';

  @IsOptional()
  @IsString()
  description?: string;
}



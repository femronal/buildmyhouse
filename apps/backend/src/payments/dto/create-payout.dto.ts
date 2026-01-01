import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePayoutDto {
  @IsString()
  contractorId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string = 'usd';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}




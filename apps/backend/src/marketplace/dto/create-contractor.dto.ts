import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateContractorDto {
  @IsString()
  name: string;

  @IsString()
  specialty: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNumber()
  @Min(0)
  hiringFee: number;

  @IsString()
  type: 'general_contractor' | 'subcontractor';

  @IsOptional()
  @IsString()
  imageUrl?: string;
}


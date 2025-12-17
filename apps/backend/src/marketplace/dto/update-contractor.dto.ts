import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateContractorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hiringFee?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

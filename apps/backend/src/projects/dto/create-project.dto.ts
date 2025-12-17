import { IsString, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  @Min(0)
  budget: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  generalContractorId?: string;
}


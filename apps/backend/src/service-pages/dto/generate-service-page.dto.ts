import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class GenerateServicePageDto {
  @IsString()
  @MinLength(2)
  serviceName: string;

  @IsIn(['lagos', 'nigeria'])
  region: 'lagos' | 'nigeria';

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  templateKind?: string;
}

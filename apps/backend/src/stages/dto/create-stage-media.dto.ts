import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateStageMediaDto {
  @IsEnum(['photo', 'video'])
  type: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}



import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @IsString()
  contractorId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  reasons?: string[];

  @IsOptional()
  @IsString()
  otherReason?: string;
}




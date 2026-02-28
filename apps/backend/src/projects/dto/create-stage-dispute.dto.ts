import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStageDisputeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  reasons: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  otherReason?: string;
}

import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateStageDocumentDto {
  @IsEnum(['receipt', 'invoice', 'contract', 'other'])
  type: string;

  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsEnum(['team', 'material', 'general'])
  category?: string;

  @IsOptional()
  @IsString()
  relatedId?: string; // ID of related team member or material

  @IsOptional()
  @IsString()
  notes?: string;
}


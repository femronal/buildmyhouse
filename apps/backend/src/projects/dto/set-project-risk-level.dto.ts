import { IsEnum } from 'class-validator';

export class SetProjectRiskLevelDto {
  @IsEnum(['low', 'medium', 'high'])
  riskLevel: 'low' | 'medium' | 'high';
}


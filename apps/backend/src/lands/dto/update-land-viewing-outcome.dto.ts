import { IsIn } from 'class-validator';

export class UpdateLandViewingOutcomeDto {
  @IsIn(['abandoned', 'purchased'])
  outcomeStatus: 'abandoned' | 'purchased';
}

import { IsIn } from 'class-validator';

export class UpdateHouseViewingOutcomeDto {
  @IsIn(['abandoned', 'purchased'])
  outcomeStatus: 'abandoned' | 'purchased';
}

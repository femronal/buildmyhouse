import { IsIn } from 'class-validator';

export class UpdateRentalViewingOutcomeDto {
  @IsIn(['abandoned', 'purchased'])
  outcomeStatus: 'abandoned' | 'purchased';
}


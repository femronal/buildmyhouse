import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDisputeStatusDto {
  @IsIn(['open', 'in_review', 'resolved'])
  status: 'open' | 'in_review' | 'resolved';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNotes?: string;
}

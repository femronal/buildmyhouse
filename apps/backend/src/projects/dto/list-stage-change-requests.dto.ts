import { IsIn, IsOptional } from 'class-validator';

export class ListStageChangeRequestsDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';
}

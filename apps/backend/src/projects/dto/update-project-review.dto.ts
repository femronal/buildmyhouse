import { IsIn } from 'class-validator';

export class UpdateProjectReviewDto {
  @IsIn(['pending_admin_review', 'changes_requested', 'approved'])
  reviewStatus: 'pending_admin_review' | 'changes_requested' | 'approved';
}


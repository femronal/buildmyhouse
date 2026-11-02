import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { AdminListingReviewQueryDto, RejectListingReviewDto } from './dto/listing-feedback.dto';
import { ListingFeedbackService } from './listing-feedback.service';

@Controller('admin/listing-reviews')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class ListingReviewsAdminController {
  constructor(private readonly feedback: ListingFeedbackService) {}

  @Get('counts')
  counts() {
    return this.feedback.queueCounts();
  }

  @Get()
  list(@Query() query: AdminListingReviewQueryDto) {
    return this.feedback.adminListReviews(query);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.feedback.approveReview(id, req.user.sub);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Req() req: { user: { sub: string } }, @Body() body: RejectListingReviewDto) {
    return this.feedback.rejectReview(id, req.user.sub, body.reason);
  }
}

import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListingReviewBodyDto, ListingPageQueryDto, ScamReportBodyDto } from './dto/listing-feedback.dto';
import { ListingFeedbackService } from './listing-feedback.service';

@Controller('listing-feedback')
export class ListingFeedbackPublicController {
  constructor(private readonly feedback: ListingFeedbackService) {}

  @Get('approved-reviews')
  approvedReviews(@Query('kind') kind = '') {
    return this.feedback.approvedReviewsBySlug(kind);
  }

  @Get(':kind/:slug/reviews')
  reviews(@Param('kind') kind: string, @Param('slug') slug: string, @Query() query: ListingPageQueryDto) {
    return this.feedback.listPublicReviews(kind, slug, query.page || 1);
  }

  @Get(':kind/:slug/my-review')
  @UseGuards(JwtAuthGuard)
  myReview(@Param('kind') kind: string, @Param('slug') slug: string, @Req() req: { user: { sub: string } }) {
    return this.feedback.myReview(kind, slug, req.user.sub);
  }

  @Post(':kind/:slug/reviews')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  submitReview(
    @Param('kind') kind: string,
    @Param('slug') slug: string,
    @Req() req: { user: { sub: string; role?: string; email?: string } },
    @Body() body: ListingReviewBodyDto,
  ) {
    return this.feedback.submitReview(kind, slug, { id: req.user.sub, role: req.user.role, email: req.user.email }, body);
  }

  @Post(':kind/:slug/scam-reports')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  submitReport(
    @Param('kind') kind: string,
    @Param('slug') slug: string,
    @Req() req: { user: { sub: string; role?: string; email?: string } },
    @Body() body: ScamReportBodyDto,
  ) {
    return this.feedback.submitReport(kind, slug, { id: req.user.sub, role: req.user.role, email: req.user.email }, body);
  }
}

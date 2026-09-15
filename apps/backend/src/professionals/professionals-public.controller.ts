import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApplyProfessionalDto,
  ClaimProfessionalDto,
  ProfessionalEnquiryDto,
  PublicProfessionalSearchDto,
} from './dto/professionals.dto';
import { ProfessionalsService } from './professionals.service';

@Controller('professionals')
export class ProfessionalsPublicController {
  constructor(private readonly professionals: ProfessionalsService) {}

  @Get()
  search(@Query() query: PublicProfessionalSearchDto) {
    return this.professionals.searchPublic(query);
  }

  @Get('meta')
  meta() {
    return this.professionals.getMeta(true);
  }

  @Post('applications')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  apply(@Body() body: ApplyProfessionalDto) {
    return this.professionals.apply(body);
  }

  @Post('claims')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  claim(@Body() body: ClaimProfessionalDto) {
    return this.professionals.claim(body);
  }

  @Post('enquiries')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  enquire(@Body() body: ProfessionalEnquiryDto) {
    return this.professionals.createEnquiry(body);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.professionals.getPublicBySlug(slug);
  }

  @Post(':slug/enquiries')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  enquireForSlug(@Param('slug') slug: string, @Body() body: ProfessionalEnquiryDto) {
    return this.professionals.createEnquiry({ ...body, slug });
  }

  @Post(':slug/verify')
  selfVerifyBlocked() {
    return this.professionals.assertPublicCannotSelfVerify();
  }
}

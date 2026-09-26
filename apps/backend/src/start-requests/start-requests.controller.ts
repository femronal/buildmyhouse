import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateStartRequestDto } from './dto/create-start-request.dto';
import { StartRequestsService } from './start-requests.service';

@Controller('start-requests')
export class StartRequestsController {
  constructor(private readonly startRequests: StartRequestsService) {}

  @Post()
  @Throttle({ short: { limit: 8, ttl: 60_000 } })
  create(@Body() dto: CreateStartRequestDto) {
    return this.startRequests.create(dto);
  }
}

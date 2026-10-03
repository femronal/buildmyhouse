import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { JoinRequestsService } from './join-requests.service';

@Controller('join-requests')
export class JoinRequestsController {
  constructor(private readonly joinRequests: JoinRequestsService) {}

  @Post()
  @Throttle({ short: { limit: 8, ttl: 60_000 } })
  create(@Body() dto: CreateJoinRequestDto) {
    return this.joinRequests.create(dto);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchDto } from '../dto/search.dto';

@Controller('marketplace/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  searchAll(@Query() searchDto: SearchDto) {
    return this.searchService.searchAll(searchDto);
  }

  @Get('suggestions')
  getSuggestions(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.searchService.getSuggestions(query || '', limit);
  }

  @Get('popular')
  getPopular(@Query('limit') limit?: number) {
    return this.searchService.getPopularItems(limit);
  }
}



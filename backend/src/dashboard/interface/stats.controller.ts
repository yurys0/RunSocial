import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { LandingStatsDto } from '../application/dto/landing-stats.dto';
import { StatsQueryDto } from '../application/dto/stats-query.dto';
import { GetLandingStatsUseCase } from '../application/get-landing-stats.use-case';

@ApiTags('Статистика')
@Controller('stats')
export class StatsController {
  constructor(private readonly getLandingStats: GetLandingStatsUseCase) {}

  @ApiOperation({ summary: 'Публичная статистика: итоги и топы бегунов за период' })
  @ApiOkResponse({ type: LandingStatsDto })
  @ApiBadRequestResponse({ description: 'Неизвестный period', type: ErrorResponseDto })
  @Header('Cache-Control', 'public, max-age=60')
  @Get()
  stats(@Query() query: StatsQueryDto) {
    return this.getLandingStats.execute(query.period);
  }
}

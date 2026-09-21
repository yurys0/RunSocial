import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { GetLandingStatsUseCase } from '../application/get-landing-stats.use-case';
import { StatsPeriod } from '../domain/dashboard.types';

/** Лендинг публичный: guard'ов здесь сознательно нет. */
@ApiTags('Статистика')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getLandingStats: GetLandingStatsUseCase) {}

  @ApiOperation({ summary: 'Публичная статистика лендинга (кэш 60 секунд)' })
  @ApiQuery({ name: 'period', enum: StatsPeriod, required: false })
  @Get('landing')
  landing(@Query('period') period?: string) {
    return this.getLandingStats.execute(this.parsePeriod(period));
  }

  private parsePeriod(value?: string): StatsPeriod {
    const period = (value ?? '').toUpperCase();
    return period in StatsPeriod ? (period as StatsPeriod) : StatsPeriod.MONTH;
  }
}

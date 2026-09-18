import { Args, Query, Resolver } from '@nestjs/graphql';

import { GetLandingStatsUseCase } from '../application/get-landing-stats.use-case';
import { StatsPeriod } from '../domain/dashboard.types';
import { LandingStatsType } from './dto/landing-stats.type';

@Resolver(() => LandingStatsType)
export class DashboardResolver {
  constructor(private readonly getLandingStats: GetLandingStatsUseCase) {}

  @Query(() => LandingStatsType, { description: 'Публичная статистика для лендинга' })
  landingStats(
    @Args('period', { type: () => StatsPeriod, defaultValue: StatsPeriod.MONTH })
    period: StatsPeriod,
  ) {
    return this.getLandingStats.execute(period);
  }
}

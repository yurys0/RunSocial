import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { DashboardCacheListener } from './application/dashboard-cache.listener';
import { GetLandingStatsUseCase } from './application/get-landing-stats.use-case';
import { DASHBOARD_REPOSITORY } from './domain/dashboard.repository';
import { PrismaDashboardRepository } from './infrastructure/prisma-dashboard.repository';
import { StatsController } from './interface/stats.controller';
import { DashboardResolver } from './interface/dashboard.resolver';

@Module({
  imports: [IdentityModule],
  controllers: [StatsController],
  providers: [
    { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
    GetLandingStatsUseCase,
    DashboardResolver,
    DashboardCacheListener,
  ],
  exports: [DashboardCacheListener],
})
export class DashboardModule {}

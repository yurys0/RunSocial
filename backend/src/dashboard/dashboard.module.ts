import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { DashboardCacheListener } from './application/dashboard-cache.listener';
import { GetLandingStatsUseCase } from './application/get-landing-stats.use-case';
import { DASHBOARD_REPOSITORY } from './domain/dashboard.repository';
import { PrismaDashboardRepository } from './infrastructure/prisma-dashboard.repository';
import { DashboardController } from './interface/dashboard.controller';
import { DashboardResolver } from './interface/dashboard.resolver';

/** Read-only модуль поверх User и Activity: своих таблиц нет, только агрегаты и кэш. */
@Module({
  imports: [IdentityModule],
  controllers: [DashboardController],
  providers: [
    { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
    GetLandingStatsUseCase,
    DashboardResolver,
    DashboardCacheListener,
  ],
  exports: [DashboardCacheListener],
})
export class DashboardModule {}

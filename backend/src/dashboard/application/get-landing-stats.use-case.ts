import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { CacheService } from '../../shared/cache/cache.service';
import { S3Service } from '../../shared/storage/s3.service';
import {
  DASHBOARD_REPOSITORY,
  DashboardRepository,
  RunnerAggregate,
} from '../domain/dashboard.repository';
import { LandingStats, StatsPeriod, TopRunner } from '../domain/dashboard.types';
import { CACHE_KEYS, LANDING_TTL_SECONDS } from './cache-keys';

const TOP_LIMIT = 10;

/** Тяжёлые агрегации, поэтому за кэшем. */
@Injectable()
export class GetLandingStatsUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY) private readonly dashboard: DashboardRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly cache: CacheService,
    private readonly s3: S3Service,
  ) {}

  async execute(period: StatsPeriod): Promise<LandingStats> {
    return this.cache.wrap(CACHE_KEYS.landing(period), LANDING_TTL_SECONDS, () =>
      this.calculate(period),
    );
  }

  private async calculate(period: StatsPeriod): Promise<LandingStats> {
    const [totals, byDistance, byCount] = await Promise.all([
      this.dashboard.getTotals(period),
      this.dashboard.getTopByDistance(period, TOP_LIMIT),
      this.dashboard.getTopByActivityCount(period, TOP_LIMIT),
    ]);

    const userIds = [...new Set([...byDistance, ...byCount].map((row) => row.userId))];
    const users = await this.users.findManyByIds(userIds);
    const byId = new Map(users.map((user) => [user.id, user]));

    const toRunners = (rows: RunnerAggregate[]): TopRunner[] =>
      rows.flatMap((row) => {
        const user = byId.get(row.userId);
        return user
          ? [
              {
                userId: row.userId,
                login: user.login,
                displayName: user.displayName,
                avatarUrl: user.avatarKey ? this.s3.publicUrl(user.avatarKey) : null,
                totalDistanceMeters: row.totalDistanceMeters,
                activityCount: row.activityCount,
              },
            ]
          : [];
      });

    return {
      period,
      ...totals,
      topByDistance: toRunners(byDistance),
      topByActivityCount: toRunners(byCount),
    };
  }
}

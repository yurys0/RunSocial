import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  DashboardRepository,
  RunnerAggregate,
  Totals,
} from '../domain/dashboard.repository';
import { StatsPeriod } from '../domain/dashboard.types';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTotals(period: StatsPeriod): Promise<Totals> {
    const where = this.periodFilter(period);
    const [totalUsers, aggregate] = await Promise.all([
      this.prisma.user.count({ where: { isPrivate: false } }),
      this.prisma.activity.aggregate({
        where,
        _count: { _all: true },
        _sum: { distanceMeters: true },
      }),
    ]);

    return {
      totalUsers,
      totalActivities: aggregate._count._all,
      totalDistanceMeters: aggregate._sum.distanceMeters ?? 0,
    };
  }

  async getTopByDistance(period: StatsPeriod, limit: number): Promise<RunnerAggregate[]> {
    return this.groupByUser(period, limit, { _sum: { distanceMeters: 'desc' } });
  }

  async getTopByActivityCount(period: StatsPeriod, limit: number): Promise<RunnerAggregate[]> {
    return this.groupByUser(period, limit, { _count: { id: 'desc' } });
  }

  private async groupByUser(
    period: StatsPeriod,
    limit: number,
    orderBy: Record<string, unknown>,
  ): Promise<RunnerAggregate[]> {
    const rows = await this.prisma.activity.groupBy({
      by: ['userId'],
      where: this.periodFilter(period),
      _sum: { distanceMeters: true },
      _count: { id: true },
      orderBy: orderBy as never,
      take: limit,
    });

    return rows.map((row) => ({
      userId: row.userId,
      totalDistanceMeters: row._sum.distanceMeters ?? 0,
      activityCount: row._count.id,
    }));
  }

  private periodFilter(period: StatsPeriod) {
    const visibility = { user: { isPrivate: false } };
    if (period === StatsPeriod.ALL) {
      return visibility;
    }
    const days = period === StatsPeriod.WEEK ? 7 : 30;
    return { ...visibility, startedAt: { gte: new Date(Date.now() - days * DAY_MS) } };
  }
}

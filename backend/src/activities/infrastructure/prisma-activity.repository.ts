import { Injectable } from '@nestjs/common';
import { Activity as PrismaActivity, Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { RoutePoint } from '../../trackers/domain/tracker-provider.interface';
import { Activity } from '../domain/activity.entity';
import {
  ActivityRepository,
  ImportActivityData,
  Pagination,
  UserActivityStats,
} from '../domain/activity.repository';

@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Пишем по записи: createMany со skipDuplicates не показывает, что оказалось новым. */
  async upsertMany(activities: ImportActivityData[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const activity of activities) {
      const existing = await this.prisma.activity.findUnique({
        where: {
          trackerAccountId_externalId: {
            trackerAccountId: activity.trackerAccountId,
            externalId: activity.externalId,
          },
        },
        select: { id: true },
      });

      const data = {
        distanceMeters: activity.distanceMeters,
        durationSeconds: activity.durationSeconds,
        avgPaceSecPerKm: activity.avgPaceSecPerKm,
        startedAt: activity.startedAt,
        // DbNull, а не JsonNull: иначе «трека нет» не отличить запросом routePoints IS NULL
        routePoints: (activity.routePoints ?? Prisma.DbNull) as
          | Prisma.NullableJsonNullValueInput
          | Prisma.InputJsonValue,
        rawPayload: activity.rawPayload as Prisma.InputJsonValue,
      };

      if (existing) {
        await this.prisma.activity.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await this.prisma.activity.create({
          data: {
            ...data,
            userId: activity.userId,
            trackerAccountId: activity.trackerAccountId,
            externalId: activity.externalId,
          },
        });
        created++;
      }
    }

    return { created, updated };
  }

  async findById(id: string): Promise<Activity | null> {
    const row = await this.prisma.activity.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.activity.delete({ where: { id } });
  }

  /** routePoints исключён из select: иначе каждая строка ленты тянула бы полный трек. */
  async findFeed(userIds: string[], pagination: Pagination): Promise<Activity[]> {
    if (userIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.activity.findMany({
      where: { userId: { in: userIds } },
      orderBy: { startedAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
      select: this.listSelect,
    });
    return rows.map((row) => this.toDomainWithoutRoute(row));
  }

  async findByUser(userId: string, pagination: Pagination): Promise<Activity[]> {
    const rows = await this.prisma.activity.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
      select: this.listSelect,
    });
    return rows.map((row) => this.toDomainWithoutRoute(row));
  }

  async findRoutePoints(activityId: string): Promise<RoutePoint[] | null> {
    const row = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { routePoints: true },
    });
    return (row?.routePoints as RoutePoint[] | null) ?? null;
  }

  async getUserStats(userId: string): Promise<UserActivityStats> {
    const result = await this.prisma.activity.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: { distanceMeters: true, durationSeconds: true },
    });
    return {
      activityCount: result._count._all,
      totalDistanceMeters: result._sum.distanceMeters ?? 0,
      totalDurationSeconds: result._sum.durationSeconds ?? 0,
    };
  }

  private readonly listSelect = {
    id: true,
    userId: true,
    trackerAccountId: true,
    externalId: true,
    distanceMeters: true,
    durationSeconds: true,
    avgPaceSecPerKm: true,
    startedAt: true,
    endedAt: true,
    createdAt: true,
  } as const;

  private toDomainWithoutRoute(row: Omit<PrismaActivity, 'routePoints' | 'rawPayload'>): Activity {
    return new Activity(
      row.id,
      row.userId,
      row.trackerAccountId,
      row.externalId,
      row.distanceMeters,
      row.durationSeconds,
      row.avgPaceSecPerKm,
      row.startedAt,
      row.endedAt,
      null,
      row.createdAt,
    );
  }

  private toDomain(row: PrismaActivity): Activity {
    return new Activity(
      row.id,
      row.userId,
      row.trackerAccountId,
      row.externalId,
      row.distanceMeters,
      row.durationSeconds,
      row.avgPaceSecPerKm,
      row.startedAt,
      row.endedAt,
      (row.routePoints as RoutePoint[] | null) ?? null,
      row.createdAt,
    );
  }
}

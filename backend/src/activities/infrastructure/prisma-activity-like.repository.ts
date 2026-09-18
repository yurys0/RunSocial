import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { ActivityLikeRepository } from '../domain/activity-like.repository';

@Injectable()
export class PrismaActivityLikeRepository implements ActivityLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async like(userId: string, activityId: string): Promise<void> {
    await this.prisma.activityLike.create({ data: { userId, activityId } });
  }

  async unlike(userId: string, activityId: string): Promise<void> {
    await this.prisma.activityLike.delete({
      where: { userId_activityId: { userId, activityId } },
    });
  }

  async exists(userId: string, activityId: string): Promise<boolean> {
    const count = await this.prisma.activityLike.count({ where: { userId, activityId } });
    return count > 0;
  }

  async countForActivities(activityIds: string[]): Promise<Map<string, number>> {
    if (activityIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.activityLike.groupBy({
      by: ['activityId'],
      where: { activityId: { in: activityIds } },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.activityId, row._count._all]));
  }

  async likedByUser(userId: string, activityIds: string[]): Promise<Set<string>> {
    if (activityIds.length === 0) {
      return new Set();
    }
    const rows = await this.prisma.activityLike.findMany({
      where: { userId, activityId: { in: activityIds } },
      select: { activityId: true },
    });
    return new Set(rows.map((row) => row.activityId));
  }
}

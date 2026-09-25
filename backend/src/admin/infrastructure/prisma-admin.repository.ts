import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  AdminRepository,
  AdminUserDetailsRow,
  AdminUserRow,
} from '../domain/admin.repository';

const COUNTS = { select: { activities: true, trackerAccounts: true } } as const;

@Injectable()
export class PrismaAdminRepository implements AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: string, limit: number, offset: number): Promise<AdminUserRow[]> {
    const rows = await this.prisma.user.findMany({
      where: searchFilter(query),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { _count: COUNTS },
    });
    return rows.map(toUserRow);
  }

  async findUser(id: string, activitiesLimit: number): Promise<AdminUserDetailsRow | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: COUNTS,
        trackerAccounts: { orderBy: { createdAt: 'asc' } },
        activities: {
          orderBy: { startedAt: 'desc' },
          take: activitiesLimit,
          select: {
            id: true,
            distanceMeters: true,
            durationSeconds: true,
            avgPaceSecPerKm: true,
            startedAt: true,
          },
        },
      },
    });

    if (!row) {
      return null;
    }
    return {
      ...toUserRow(row),
      trackerAccounts: row.trackerAccounts.map((account) => ({
        id: account.id,
        provider: account.provider,
        status: account.status,
        externalUserId: account.externalUserId,
        lastSyncAt: account.lastSyncAt,
        createdAt: account.createdAt,
      })),
      activities: row.activities,
    };
  }
}

function searchFilter(query: string): Prisma.UserWhereInput {
  if (!query) {
    return {};
  }
  return {
    OR: [
      { login: { contains: query, mode: 'insensitive' } },
      { displayName: { contains: query, mode: 'insensitive' } },
    ],
  };
}

type UserWithCounts = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  createdAt: Date;
  _count: { activities: number; trackerAccounts: number };
};

function toUserRow(row: UserWithCounts): AdminUserRow {
  return {
    id: row.id,
    login: row.login,
    displayName: row.displayName,
    avatarKey: row.avatarUrl,
    isPrivate: row.isPrivate,
    createdAt: row.createdAt,
    activityCount: row._count.activities,
    trackerCount: row._count.trackerAccounts,
  };
}

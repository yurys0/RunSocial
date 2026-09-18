import { Injectable } from '@nestjs/common';
import { TrackerAccount as PrismaTrackerAccount, TrackerProviderName } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { TrackerAccount } from '../domain/tracker-account.entity';
import {
  CreateTrackerAccountData,
  TrackerAccountRepository,
} from '../domain/tracker-account.repository';

@Injectable()
export class PrismaTrackerAccountRepository implements TrackerAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TrackerAccount | null> {
    const row = await this.prisma.trackerAccount.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByUser(userId: string): Promise<TrackerAccount[]> {
    const rows = await this.prisma.trackerAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByUserAndProvider(
    userId: string,
    provider: TrackerProviderName,
  ): Promise<TrackerAccount | null> {
    const row = await this.prisma.trackerAccount.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateTrackerAccountData): Promise<TrackerAccount> {
    const row = await this.prisma.trackerAccount.create({ data });
    return this.toDomain(row);
  }

  async save(account: TrackerAccount): Promise<TrackerAccount> {
    const row = await this.prisma.trackerAccount.update({
      where: { id: account.id },
      data: {
        status: account.status,
        lastSyncAt: account.lastSyncAt,
        externalUserId: account.externalUserId,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.trackerAccount.delete({ where: { id } });
  }

  private toDomain(row: PrismaTrackerAccount): TrackerAccount {
    return new TrackerAccount(
      row.id,
      row.userId,
      row.provider,
      row.encryptedCredentials,
      row.externalUserId,
      row.status,
      row.lastSyncAt,
      row.createdAt,
    );
  }
}

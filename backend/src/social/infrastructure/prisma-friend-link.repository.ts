import { Injectable } from '@nestjs/common';
import { FriendLink as PrismaFriendLink, FriendLinkStatus } from '@prisma/client';

import { Pagination } from '../../shared/pagination/pagination';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { FriendLink } from '../domain/friend-link.entity';
import { FriendLinkRepository } from '../domain/friend-link.repository';

@Injectable()
export class PrismaFriendLinkRepository implements FriendLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAcceptedFriendIds(userId: string, pagination?: Pagination): Promise<string[]> {
    const links = await this.prisma.friendLink.findMany({
      where: {
        status: FriendLinkStatus.ACCEPTED,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      select: { fromUserId: true, toUserId: true },
      ...(pagination && {
        orderBy: { updatedAt: 'desc' as const },
        skip: pagination.offset,
        take: pagination.limit,
      }),
    });

    return links.map((link) => (link.fromUserId === userId ? link.toUserId : link.fromUserId));
  }

  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const count = await this.prisma.friendLink.count({
      where: {
        status: FriendLinkStatus.ACCEPTED,
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId },
        ],
      },
    });
    return count > 0;
  }

  async findById(id: string): Promise<FriendLink | null> {
    const row = await this.prisma.friendLink.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBetween(userId: string, otherUserId: string): Promise<FriendLink | null> {
    const row = await this.prisma.friendLink.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId },
        ],
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBetweenMany(userId: string, otherUserIds: string[]): Promise<FriendLink[]> {
    if (otherUserIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.friendLink.findMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: { in: otherUserIds } },
          { fromUserId: { in: otherUserIds }, toUserId: userId },
        ],
      },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findIncoming(userId: string): Promise<FriendLink[]> {
    const rows = await this.prisma.friendLink.findMany({
      where: { toUserId: userId, status: FriendLinkStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findOutgoing(userId: string): Promise<FriendLink[]> {
    const rows = await this.prisma.friendLink.findMany({
      where: { fromUserId: userId, status: FriendLinkStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(fromUserId: string, toUserId: string): Promise<FriendLink> {
    const row = await this.prisma.friendLink.create({ data: { fromUserId, toUserId } });
    return this.toDomain(row);
  }

  async save(link: FriendLink): Promise<FriendLink> {
    const row = await this.prisma.friendLink.update({
      where: { id: link.id },
      data: { status: link.status },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.friendLink.delete({ where: { id } });
  }

  private toDomain(row: PrismaFriendLink): FriendLink {
    return new FriendLink(
      row.id,
      row.fromUserId,
      row.toUserId,
      row.status,
      row.createdAt,
      row.updatedAt,
    );
  }
}

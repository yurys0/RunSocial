import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { User } from '../domain/user.entity';
import { CreateUserData, UserRepository } from '../domain/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByLogin(login: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { login } });
    return row ? this.toDomain(row) : null;
  }

  async search(query: string, limit: number, excludeUserId?: string): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { login: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      orderBy: { login: 'asc' },
      take: limit,
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.prisma.user.findMany({ where: { id: { in: ids } } });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await this.prisma.user.create({ data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async save(user: User): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        login: user.login,
        displayName: user.displayName,
        avatarUrl: user.avatarKey,
        isPrivate: user.isPrivate,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaUser): User {
    return new User(
      row.id,
      row.login,
      row.displayName,
      row.avatarUrl,
      row.isPrivate,
      row.createdAt,
    );
  }
}

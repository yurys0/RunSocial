import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache/cache.service';
import { EncryptionService } from './crypto/encryption.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { S3Service } from './storage/s3.service';

/** @Global, чтобы доменные модули не перечисляли инфраструктуру в своих imports. */
@Global()
@Module({
  providers: [PrismaService, EncryptionService, S3Service, RedisService, CacheService],
  exports: [PrismaService, EncryptionService, S3Service, RedisService, CacheService],
})
export class SharedModule {}

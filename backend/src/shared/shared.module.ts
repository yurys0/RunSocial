import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CacheService } from './cache/cache.service';
import { EncryptionService } from './crypto/encryption.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { S3Service } from './storage/s3.service';

/** @Global, чтобы доменные модули не перечисляли инфраструктуру в своих imports. */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          // в типах expiresIn — литерал вида '24h', а из .env приходит обычный string
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '24h') as `${number}h`,
        },
      }),
    }),
  ],
  providers: [PrismaService, EncryptionService, S3Service, RedisService, CacheService, JwtAuthGuard],
  exports: [
    PrismaService,
    EncryptionService,
    S3Service,
    RedisService,
    CacheService,
    JwtAuthGuard,
    JwtModule,
  ],
})
export class SharedModule {}

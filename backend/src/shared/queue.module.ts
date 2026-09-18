import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

/** BullMQ живёт в отдельной базе Redis (db 1), чтобы не пересекаться с кэшем и pub/sub (db 0). */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(config.get<string>('REDIS_PORT') ?? 6379),
          db: Number(config.get<string>('REDIS_QUEUE_DB') ?? 1),
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

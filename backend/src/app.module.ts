import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ActivitiesModule } from './activities/activities.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IdentityModule } from './identity/identity.module';
import { SocialModule } from './social/social.module';
import { GraphqlModule } from './shared/graphql.module';
import { HealthController } from './shared/health.controller';
import { QueueModule } from './shared/queue.module';
import { SharedModule } from './shared/shared.module';
import { TrackersModule } from './trackers/trackers.module';

/** Процессоров очередей здесь нет: API только ставит задачи, выполняет их WorkerModule. */
@Module({
  imports: [
    // Один .env в корне: первый путь для запуска с хоста, второй — внутри контейнера
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    EventEmitterModule.forRoot(),
    SharedModule,
    QueueModule,
    GraphqlModule,
    IdentityModule,
    ActivitiesModule,
    SocialModule,
    TrackersModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

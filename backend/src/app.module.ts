import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SuperTokensModule } from 'supertokens-nestjs';

import { ActivitiesModule } from './activities/activities.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { USER_REPOSITORY } from './identity/domain/user.repository';
import { IdentityModule } from './identity/identity.module';
import { buildSuperTokensOptions } from './identity/infrastructure/supertokens.config';
import { GraphqlModule } from './shared/graphql.module';
import { HealthController } from './shared/health.controller';
import { QueueModule } from './shared/queue.module';
import { SharedModule } from './shared/shared.module';
import { SocialModule } from './social/social.module';
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
    // Регистрация создаёт профиль через USER_REPOSITORY, поэтому опции собираются асинхронно
    SuperTokensModule.forRootAsync({
      imports: [IdentityModule],
      inject: [ConfigService, USER_REPOSITORY],
      useFactory: buildSuperTokensOptions,
    }),
    ActivitiesModule,
    SocialModule,
    TrackersModule,
    DashboardModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

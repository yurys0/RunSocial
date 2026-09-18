import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ActivitiesModule } from './activities/activities.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QueueModule } from './shared/queue.module';
import { SharedModule } from './shared/shared.module';
import { TrackersModule } from './trackers/trackers.module';
import { SyncActivitiesProcessor } from './trackers/worker/sync-activities.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    // Импорт активностей возникает здесь, поэтому слушатель кэша нужен и в воркере
    EventEmitterModule.forRoot(),
    SharedModule,
    QueueModule,
    ActivitiesModule,
    TrackersModule,
    DashboardModule,
  ],
  providers: [SyncActivitiesProcessor],
})
export class WorkerModule {}

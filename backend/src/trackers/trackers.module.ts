import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { ConnectTrackerUseCase } from './application/connect-tracker.use-case';
import { DisconnectTrackerUseCase } from './application/disconnect-tracker.use-case';
import { InitiateSyncUseCase } from './application/initiate-sync.use-case';
import { ListTrackerAccountsUseCase } from './application/list-tracker-accounts.use-case';
import { SyncActivitiesUseCase } from './application/sync-activities.use-case';
import { TRACKER_ACCOUNT_REPOSITORY } from './domain/tracker-account.repository';
import { PrismaTrackerAccountRepository } from './infrastructure/prisma-tracker-account.repository';
import { PacerProvider } from './infrastructure/providers/pacer.provider';
import { RuntasticProvider } from './infrastructure/providers/runtastic.provider';
import { StravaProvider } from './infrastructure/providers/strava.provider';
import { TrackerProviderRegistry } from './infrastructure/providers/tracker-provider.registry';
import { SYNC_QUEUE_NAME } from './infrastructure/sync-queue';
import { SyncEventsController } from './interface/sync-events.controller';
import { TrackersController } from './interface/trackers.controller';
import { TrackersResolver } from './interface/trackers.resolver';

@Module({
  imports: [BullModule.registerQueue({ name: SYNC_QUEUE_NAME }), ActivitiesModule],
  controllers: [TrackersController, SyncEventsController],
  providers: [
    { provide: TRACKER_ACCOUNT_REPOSITORY, useClass: PrismaTrackerAccountRepository },
    StravaProvider,
    RuntasticProvider,
    PacerProvider,
    TrackerProviderRegistry,
    ConnectTrackerUseCase,
    ListTrackerAccountsUseCase,
    DisconnectTrackerUseCase,
    InitiateSyncUseCase,
    SyncActivitiesUseCase,
    TrackersResolver,
  ],
  // SyncActivitiesUseCase нужен процессору очереди, который живёт в WorkerModule
  exports: [SyncActivitiesUseCase],
})
export class TrackersModule {}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { SyncActivitiesUseCase } from '../application/sync-activities.use-case';
import { SYNC_QUEUE_NAME, SyncJobData } from '../infrastructure/sync-queue';

@Processor(SYNC_QUEUE_NAME)
export class SyncActivitiesProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncActivitiesProcessor.name);

  constructor(private readonly syncActivities: SyncActivitiesUseCase) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<void> {
    this.logger.log(`Задача ${job.id}: синк аккаунта ${job.data.trackerAccountId}`);
    await this.syncActivities.execute(job.data.userId, job.data.trackerAccountId);
  }
}

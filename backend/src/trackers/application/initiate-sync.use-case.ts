import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import {
  TRACKER_ACCOUNT_REPOSITORY,
  TrackerAccountRepository,
} from '../domain/tracker-account.repository';
import { TrackerAccountNotFoundError } from '../domain/trackers.errors';
import { SYNC_QUEUE_NAME, SyncJobData } from '../infrastructure/sync-queue';

/** API только ставит задачу в очередь; выполняет её процесс воркера. */
@Injectable()
export class InitiateSyncUseCase {
  constructor(
    @Inject(TRACKER_ACCOUNT_REPOSITORY) private readonly accounts: TrackerAccountRepository,
    @InjectQueue(SYNC_QUEUE_NAME) private readonly queue: Queue<SyncJobData>,
  ) {}

  async execute(actor: AuthenticatedUser, accountId: string): Promise<{ jobId: string }> {
    const account = await this.accounts.findById(accountId);
    if (!account || (account.userId !== actor.userId && !actor.isAdmin)) {
      throw new TrackerAccountNotFoundError();
    }

    const job = await this.queue.add(
      'sync',
      // Пробежки импортируются владельцу привязки, даже если синк запустил администратор
      { userId: account.userId, trackerAccountId: accountId },
      {
        // Фиксированный jobId не даёт наплодить задач; завершённые удаляем, иначе
        // повторный синк после ошибки был бы невозможен
        jobId: `sync-${accountId}`,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    return { jobId: String(job.id) };
  }
}

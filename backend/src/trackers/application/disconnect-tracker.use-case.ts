import { Inject, Injectable } from '@nestjs/common';

import {
  TRACKER_ACCOUNT_REPOSITORY,
  TrackerAccountRepository,
} from '../domain/tracker-account.repository';
import { TrackerAccountNotFoundError } from '../domain/trackers.errors';

@Injectable()
export class DisconnectTrackerUseCase {
  constructor(
    @Inject(TRACKER_ACCOUNT_REPOSITORY) private readonly accounts: TrackerAccountRepository,
  ) {}

  /** Удаление привязки уносит и импортированные активности — каскадом на уровне БД. */
  async execute(userId: string, accountId: string): Promise<void> {
    const account = await this.accounts.findById(accountId);
    if (!account || account.userId !== userId) {
      throw new TrackerAccountNotFoundError();
    }
    await this.accounts.delete(accountId);
  }
}

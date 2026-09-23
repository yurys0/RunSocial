import { Inject, Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
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
  async execute(actor: AuthenticatedUser, accountId: string): Promise<void> {
    const account = await this.accounts.findById(accountId);
    if (!account || (account.userId !== actor.userId && !actor.isAdmin)) {
      throw new TrackerAccountNotFoundError();
    }
    await this.accounts.delete(accountId);
  }
}

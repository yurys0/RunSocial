import { Inject, Injectable } from '@nestjs/common';

import {
  TRACKER_ACCOUNT_REPOSITORY,
  TrackerAccountRepository,
} from '../domain/tracker-account.repository';
import { toTrackerAccountView, TrackerAccountView } from './tracker-account-view';

@Injectable()
export class ListTrackerAccountsUseCase {
  constructor(
    @Inject(TRACKER_ACCOUNT_REPOSITORY) private readonly accounts: TrackerAccountRepository,
  ) {}

  async execute(userId: string): Promise<TrackerAccountView[]> {
    const accounts = await this.accounts.findByUser(userId);
    return accounts.map(toTrackerAccountView);
  }
}

import { TrackerProviderName } from '@prisma/client';

import { TrackerAccount } from './tracker-account.entity';

export const TRACKER_ACCOUNT_REPOSITORY = Symbol('TRACKER_ACCOUNT_REPOSITORY');

export type CreateTrackerAccountData = {
  userId: string;
  provider: TrackerProviderName;
  encryptedCredentials: string;
  externalUserId: string | null;
};

export interface TrackerAccountRepository {
  findById(id: string): Promise<TrackerAccount | null>;
  findByUser(userId: string): Promise<TrackerAccount[]>;
  findByUserAndProvider(
    userId: string,
    provider: TrackerProviderName,
  ): Promise<TrackerAccount | null>;
  create(data: CreateTrackerAccountData): Promise<TrackerAccount>;
  save(account: TrackerAccount): Promise<TrackerAccount>;
  delete(id: string): Promise<void>;
}

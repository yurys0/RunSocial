import { TrackerAccount } from '../domain/tracker-account.entity';

export type TrackerAccountView = {
  id: string;
  provider: string;
  status: string;
  externalUserId: string | null;
  lastSyncAt: Date | null;
  createdAt: Date;
};

export function toTrackerAccountView(account: TrackerAccount): TrackerAccountView {
  return {
    id: account.id,
    provider: account.provider,
    status: account.status,
    externalUserId: account.externalUserId,
    lastSyncAt: account.lastSyncAt,
    createdAt: account.createdAt,
  };
}

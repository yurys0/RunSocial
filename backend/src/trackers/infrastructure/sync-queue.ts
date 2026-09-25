export const SYNC_QUEUE_NAME = 'tracker-sync';

export type SyncJobData = {
  userId: string;
  trackerAccountId: string;
};

export function syncProgressChannel(userId: string): string {
  return `sync:progress:${userId}`;
}

export type SyncProgressEvent = {
  trackerAccountId: string;
  provider: string;
} & (
  | { stage: 'started' }
  | { stage: 'progress'; done: number; total: number }
  | { stage: 'done'; imported: number; updated: number }
  | { stage: 'error'; message: string }
);


export const SYNC_QUEUE_NAME = 'tracker-sync';

export type SyncJobData = {
  userId: string;
  trackerAccountId: string;
};

/** Канал Redis pub/sub, через который воркер шлёт прогресс в API-процесс. */
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

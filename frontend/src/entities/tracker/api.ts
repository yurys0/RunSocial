import { rest } from '../../shared/api/client';

export type TrackerAccount = {
  id: string;
  provider: 'STRAVA' | 'ADIDAS' | 'PACER';
  status: 'ACTIVE' | 'ERROR' | 'DISCONNECTED';
  externalUserId: string | null;
  lastSyncAt: string | null;
  createdAt: string;
};

/** ADIDAS в API — это Adidas Running (Runtastic). */
export const PROVIDER_LABELS: Record<TrackerAccount['provider'], string> = {
  STRAVA: 'Strava',
  ADIDAS: 'Adidas Running',
  PACER: 'Pacer',
};

export function fetchTrackers(): Promise<TrackerAccount[]> {
  return rest('/trackers');
}

export function connectTracker(provider: string, login: string, password: string) {
  return rest<TrackerAccount>('/trackers', { method: 'POST', body: { provider, login, password } });
}

export function disconnectTracker(id: string) {
  return rest<void>(`/trackers/${id}`, { method: 'DELETE' });
}

export function startSync(id: string): Promise<{ jobId: string }> {
  return rest(`/trackers/${id}/syncs`, { method: 'POST' });
}

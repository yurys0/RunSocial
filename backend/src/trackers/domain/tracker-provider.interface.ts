import { TrackerProviderName } from '@prisma/client';

export type RoutePoint = {
  lat: number;
  lng: number;
  altitudeMeters: number | null;
  timestampOffsetSec: number;
};

export type NormalizedActivity = {
  externalId: string;
  distanceMeters: number;
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date | null;
  routePoints: RoutePoint[] | null;
  rawPayload: unknown;
};

export type TrackerSession = {
  accessToken: string;
  externalUserId: string;
  providerData?: Record<string, unknown>;
};

export type TrackerCredentials = {
  login: string;
  password: string;
};

export type SyncProgressCallback = (done: number, total: number) => void;

export interface TrackerProvider {
  readonly provider: TrackerProviderName;

  authenticate(credentials: TrackerCredentials): Promise<TrackerSession>;

  fetchActivities(
    session: TrackerSession,
    since: Date | null,
    onProgress?: SyncProgressCallback,
  ): Promise<NormalizedActivity[]>;
}

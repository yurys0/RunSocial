import { TrackerProviderName } from '@prisma/client';

export type RoutePoint = {
  lat: number;
  lng: number;
  /** null, если трекер не отдал высоту — интерполяцию не делаем */
  altitudeMeters: number | null;
  /** Секунды от начала активности, не абсолютный timestamp */
  timestampOffsetSec: number;
};

/** Единицы измерения — метры и секунды. */
export type NormalizedActivity = {
  externalId: string;
  distanceMeters: number;
  durationSeconds: number;
  startedAt: Date;
  /** Из ответа API, а не startedAt + duration: в duration только время в движении. */
  endedAt: Date | null;
  /** null — трека нет (Strava без streams, Runtastic 404, Pacer без track_id) */
  routePoints: RoutePoint[] | null;
  rawPayload: unknown;
};

/** Не только токен: Pacer требует ещё accountId, Runtastic — guid пользователя. */
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

/** Strategy: новый трекер — это новый класс и одна строка в реестре. */
export interface TrackerProvider {
  readonly provider: TrackerProviderName;

  authenticate(credentials: TrackerCredentials): Promise<TrackerSession>;

  /** Загрузка треков спрятана внутри: наружу идут готовые NormalizedActivity. */
  fetchActivities(
    session: TrackerSession,
    since: Date | null,
    onProgress?: SyncProgressCallback,
  ): Promise<NormalizedActivity[]>;
}

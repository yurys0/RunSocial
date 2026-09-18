import { createHash, createHmac, randomInt } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackerProviderName } from '@prisma/client';

import {
  NormalizedActivity,
  RoutePoint,
  SyncProgressCallback,
  TrackerCredentials,
  TrackerProvider,
  TrackerSession,
} from '../../domain/tracker-provider.interface';
import { TrackerAuthFailedError, TrackerUnavailableError } from '../../domain/trackers.errors';
import { PACER_SUPPORTED_ACTIVITY_TYPES } from './sport-filters';
import { TrackerHttp } from './tracker-http';

/** Ограничение API Pacer: диапазон дат в одном запросе — не больше 31 дня */
const MAX_WINDOW_DAYS = 31;
const DAY_MS = 24 * 60 * 60 * 1000;

type PacerAuthResponse = {
  success: boolean;
  data?: { id: number; access_token: string } | null;
  message?: string;
};

type PacerActivity = {
  type_string?: string | null;
  distance?: number | null;
  active_time?: number | null;
  recorded_for_datetime_iso8601?: string | null;
  normalized_session_id?: string | null;
  client_hash?: string | null;
  track_id?: number | null;
  end_for_unixtime?: number | null;
  [key: string]: unknown;
};

type PacerActivitiesResponse = {
  success: boolean;
  data?: { sessions?: PacerActivity[] | null } | null;
};

type PacerTrackResponse = {
  success: boolean;
  data?: { track_data?: string | null; start_time?: number | null } | null;
};

/** Порт исходного Python-клиента Pacer. */
@Injectable()
export class PacerProvider implements TrackerProvider {
  readonly provider = TrackerProviderName.PACER;

  private readonly http: TrackerHttp;
  private readonly secretKey: string;

  constructor(config: ConfigService) {
    this.http = new TrackerHttp('Pacer', {
      baseUrl: config.get<string>('PACER_BASE_URL') ?? 'https://api.pacer.cc',
      proxy: config.get<string>('PACER_PROXY'),
      defaultHeaders: {
        'X-Pacer-Client-Id': config.get<string>('PACER_CLIENT_ID') ?? '',
        'X-Pacer-Product': config.get<string>('PACER_PRODUCT') ?? 'pacer',
        'X-Pacer-Version': config.get<string>('PACER_VERSION') ?? 'p12.2.2',
        'X-Pacer-Locale': config.get<string>('PACER_LOCALE') ?? 'ru_RU',
        'X-Pacer-Language': config.get<string>('PACER_LANGUAGE') ?? 'ru',
        'X-Pacer-Timezone': config.get<string>('PACER_TIMEZONE') ?? 'Europe/Moscow',
        'X-Pacer-Timezone-Offset': config.get<string>('PACER_TIMEZONE_OFFSET') ?? '180',
      },
    });
    this.secretKey = config.get<string>('PACER_SECRET_KEY') ?? '';
  }

  async authenticate(credentials: TrackerCredentials): Promise<TrackerSession> {
    const path = '/api/v2.0/login';
    // Pacer ожидает md5 от пароля (это его протокол; пароли наших пользователей — bcrypt)
    const body = {
      email: credentials.login,
      password: createHash('md5').update(credentials.password, 'utf8').digest('hex'),
    };
    // Тело подписывается и отправляется в одном и том же компактном виде — иначе 401
    const rawBody = JSON.stringify(body);

    const auth = await this.http.postJson<PacerAuthResponse>(path, {
      headers: {
        'Content-Type': 'application/json',
        'X-Pacer-OS': 'android',
        ...this.buildAuthHeaders({ path, rawBody }),
      },
      rawBody,
    });

    if (!auth.success || !auth.data?.access_token) {
      throw new TrackerAuthFailedError('Pacer');
    }

    return {
      accessToken: auth.data.access_token,
      externalUserId: String(auth.data.id),
      providerData: { accountId: auth.data.id },
    };
  }

  async fetchActivities(
    session: TrackerSession,
    since: Date | null,
    onProgress?: SyncProgressCallback,
  ): Promise<NormalizedActivity[]> {
    const accountId = Number(session.providerData?.accountId ?? session.externalUserId);
    const sessions = await this.fetchSessions(session, accountId, since);
    const runs = sessions.filter(
      (activity) =>
        activity.type_string != null &&
        PACER_SUPPORTED_ACTIVITY_TYPES.includes(activity.type_string),
    );

    const result: NormalizedActivity[] = [];
    for (const [index, activity] of runs.entries()) {
      const externalId = activity.normalized_session_id ?? activity.client_hash;
      if (!externalId) {
        continue; // без стабильного идентификатора активность не сохранить идемпотентно
      }

      const startedAt = new Date(activity.recorded_for_datetime_iso8601 ?? 0);
      result.push({
        externalId,
        distanceMeters: Math.round(activity.distance ?? 0),
        durationSeconds: activity.active_time ?? 0,
        startedAt,
        endedAt: this.resolveEndedAt(activity, startedAt),
        routePoints: activity.track_id
          ? await this.fetchRoutePoints(session, accountId, activity.track_id, startedAt)
          : null,
        rawPayload: activity,
      });
      onProgress?.(index + 1, runs.length);
    }
    return result;
  }

  private resolveEndedAt(activity: PacerActivity, startedAt: Date): Date | null {
    const endUnix = activity.end_for_unixtime;
    if (typeof endUnix !== 'number' || endUnix <= 0) {
      return null;
    }
    const endedAt = new Date(endUnix * 1000);
    // Страховка от мусорных значений: завершение не может быть раньше старта
    return endedAt > startedAt ? endedAt : null;
  }

  private async fetchSessions(
    session: TrackerSession,
    accountId: number,
    since: Date | null,
  ): Promise<PacerActivity[]> {
    const path = '/pacer/ios/api/v19/accounts/me/activities/sessions';
    const now = new Date();
    const from = since ?? new Date(now.getTime() - 365 * DAY_MS);

    const all: PacerActivity[] = [];
    let windowStart = from;
    while (windowStart < now) {
      const windowEnd = new Date(
        Math.min(windowStart.getTime() + MAX_WINDOW_DAYS * DAY_MS, now.getTime()),
      );
      const query = {
        current_data_source: 'pacer',
        from_date: this.formatDate(windowStart),
        to_date: this.formatDate(windowEnd),
      };

      const response = await this.http.getJson<PacerActivitiesResponse>(path, {
        headers: this.buildAuthHeaders({
          path,
          query,
          accessToken: session.accessToken,
          accountId,
        }),
        query,
      });
      all.push(...(response.data?.sessions ?? []));

      windowStart = new Date(windowEnd.getTime() + DAY_MS);
    }
    return all;
  }

  private async fetchRoutePoints(
    session: TrackerSession,
    accountId: number,
    trackId: number,
    startedAt: Date,
  ): Promise<RoutePoint[] | null> {
    const path = `/pacer/android/api/v19/track/${trackId}`;
    const response = await this.http.getJson<PacerTrackResponse>(path, {
      headers: this.buildAuthHeaders({ path, accessToken: session.accessToken, accountId }),
    });

    const trackData = response.data?.track_data;
    if (!response.success || !trackData) {
      return null;
    }

    const startTimeSec = response.data?.start_time ?? Math.floor(startedAt.getTime() / 1000);
    const points = this.parseTrackData(trackData, startTimeSec);
    return points.length ? points : null;
  }

  /**
   * track_data — строка через '|': точка это 'lat,lon,alt,unix_ts,flag',
   * одиночные '1' и '3' — разделители сегментов. Схлопываем в плоский массив:
   * пауза видна по разрыву в timestampOffsetSec.
   */
  private parseTrackData(trackData: string, startTimeSec: number): RoutePoint[] {
    const points: RoutePoint[] = [];

    for (const rawPart of trackData.split('|')) {
      const part = rawPart.trim();
      if (!part || part === '1' || part === '3') {
        continue;
      }

      const fields = part.split(',');
      if (fields.length < 4) {
        continue;
      }

      const timestampSec = Number(fields[3]);
      points.push({
        lat: Number(fields[0]),
        lng: Number(fields[1]),
        altitudeMeters: Number(fields[2]),
        timestampOffsetSec: Math.max(0, Math.round(timestampSec - startTimeSec)),
      });
    }
    return points;
  }

  /**
   * HMAC-SHA1 в строгом порядке: timestamp, nonce, access_token, urlencoded query, md5(тело), path.
   */
  private buildAuthHeaders(options: {
    path: string;
    query?: Record<string, string | number | undefined>;
    rawBody?: string;
    accessToken?: string;
    accountId?: number;
  }): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = randomInt(0, 1_000_000_000);
    const accessToken = options.accessToken ?? '';
    const accountId = options.accountId ?? 1;

    const mac = createHmac('sha1', this.secretKey);
    mac.update(String(timestamp), 'utf8');
    mac.update(String(nonce), 'utf8');
    if (accessToken) {
      mac.update(accessToken, 'utf8');
    }
    if (options.query) {
      mac.update(this.http.buildQueryString(options.query), 'utf8');
    }
    if (options.rawBody) {
      mac.update(createHash('md5').update(options.rawBody, 'utf8').digest('hex'), 'utf8');
    }
    mac.update(options.path, 'utf8');

    const signature = encodeURIComponent(mac.digest('base64')).replace(/%0A/g, '');
    return {
      Authorization: `Pacer ${signature}`,
      'X-Pacer-Access-Token': accessToken,
      'X-Pacer-Account-Id': String(accountId),
      'X-Pacer-Time': String(timestamp),
      'X-Pacer-Nonce': String(nonce),
    };
  }

  /** Формат дат в запросе активностей — YYMMDD */
  private formatDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(date.getFullYear() % 100)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  }
}

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
import {
  STRAVA_SUPPORTED_ACTIVITY_SPORT_TYPES,
  STRAVA_SUPPORTED_ACTIVITY_TYPES,
} from './sport-filters';
import { TrackerHttp } from './tracker-http';

const PER_PAGE_MAX = 200;
const MAX_PAGES = 100_000;

type StravaAuthResponse = { access_token?: string };

type StravaAthlete = { id: number };

type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  [key: string]: unknown;
};

type StravaStream = { data: unknown[] };

type StravaStreamsResponse = {
  latlng?: StravaStream;
  altitude?: StravaStream;
  time?: StravaStream;
};

@Injectable()
export class StravaProvider implements TrackerProvider {
  readonly provider = TrackerProviderName.STRAVA;

  private readonly http: TrackerHttp;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config: ConfigService) {
    this.http = new TrackerHttp('Strava', {
      baseUrl: config.get<string>('STRAVA_BASE_URL') ?? 'https://www.strava.com',
      proxy: config.get<string>('STRAVA_PROXY'),
    });
    this.clientId = config.get<string>('STRAVA_CLIENT_ID') ?? '';
    this.clientSecret = config.get<string>('STRAVA_CLIENT_SECRET') ?? '';
  }

  async authenticate(credentials: TrackerCredentials): Promise<TrackerSession> {
    const auth = await this.http.postJson<StravaAuthResponse>('/api/v3/oauth/internal/token', {
      query: { hl: 'ru-RU' },
      headers: { 'Content-Type': 'application/json' },
      rawBody: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        email: credentials.login,
        password: credentials.password,
      }),
    });

    if (!auth.access_token) {
      throw new TrackerAuthFailedError('Strava');
    }

    const athlete = await this.getJson<StravaAthlete>('/api/v3/athlete', auth.access_token);
    return { accessToken: auth.access_token, externalUserId: String(athlete.id) };
  }

  async fetchActivities(
    session: TrackerSession,
    since: Date | null,
    onProgress?: SyncProgressCallback,
  ): Promise<NormalizedActivity[]> {
    const activities = await this.fetchAllActivities(session.accessToken, since);
    const runs = activities.filter(
      (activity) =>
        STRAVA_SUPPORTED_ACTIVITY_TYPES.includes(activity.type) ||
        STRAVA_SUPPORTED_ACTIVITY_SPORT_TYPES.includes(activity.sport_type),
    );

    const result: NormalizedActivity[] = [];
    for (const [index, activity] of runs.entries()) {
      result.push({
        externalId: String(activity.id),
        distanceMeters: Math.round(activity.distance),
        durationSeconds: activity.moving_time,
        startedAt: new Date(activity.start_date),
        endedAt: this.resolveEndedAt(activity),
        routePoints: await this.fetchRoutePoints(activity.id, session.accessToken),
        rawPayload: activity,
      });
      onProgress?.(index + 1, runs.length);
    }
    return result;
  }

  private resolveEndedAt(activity: StravaActivity): Date | null {
    if (!activity.elapsed_time || activity.elapsed_time <= 0) {
      return null;
    }
    return new Date(new Date(activity.start_date).getTime() + activity.elapsed_time * 1000);
  }

  private async fetchAllActivities(accessToken: string, since: Date | null) {
    const result: StravaActivity[] = [];
    const seen = new Set<number>();
    let beforeCursor: number | undefined;
    let previousBefore: number | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
      const batch = await this.getJson<StravaActivity[]>('/api/v3/athlete/activities', accessToken, {
        per_page: PER_PAGE_MAX,
        page: 1,
        before: beforeCursor,
      });
      if (!Array.isArray(batch) || batch.length === 0) {
        break;
      }

      for (const activity of batch) {
        if (!seen.has(activity.id)) {
          seen.add(activity.id);
          result.push(activity);
        }
      }

      const oldest = batch[batch.length - 1];
      const oldestEpoch = this.startEpochUtc(oldest);
      if (since && oldestEpoch * 1000 <= since.getTime()) {
        break;
      }
      if (batch.length < PER_PAGE_MAX) {
        break;
      }
      if (oldestEpoch === previousBefore) {
        break; // курсор не сдвинулся — страховка от зацикливания
      }
      previousBefore = oldestEpoch;
      beforeCursor = oldestEpoch;
    }

    return since ? result.filter((a) => new Date(a.start_date).getTime() > since.getTime()) : result;
  }

  private async fetchRoutePoints(
    activityId: number,
    accessToken: string,
  ): Promise<RoutePoint[] | null> {
    const streams = await this.getJson<StravaStreamsResponse>(
      `/api/v3/activities/${activityId}/streams`,
      accessToken,
      { keys: 'latlng,altitude,time', key_by_type: 'true' },
    );

    const latlng = streams.latlng?.data as [number, number][] | undefined;
    if (!latlng?.length) {
      return null;
    }
    const altitude = streams.altitude?.data as number[] | undefined;
    const time = streams.time?.data as number[] | undefined;

    return latlng.map(([lat, lng], index) => ({
      lat,
      lng,
      altitudeMeters: altitude?.[index] ?? null,
      timestampOffsetSec: time?.[index] ?? 0,
    }));
  }

  private async getJson<T>(
    path: string,
    accessToken: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const response = await this.http.get(path, {
      // Внутренний API Strava ожидает именно "access_token <token>", не "Bearer"
      headers: { Authorization: `access_token ${accessToken}` },
      query,
    });

    if (response.status === 401) {
      throw new TrackerAuthFailedError('Strava');
    }
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new TrackerUnavailableError('Strava', `неожиданный ответ (HTTP ${response.status})`);
    }
  }

  private startEpochUtc(activity: StravaActivity): number {
    return Math.floor(new Date(activity.start_date).getTime() / 1000);
  }
}

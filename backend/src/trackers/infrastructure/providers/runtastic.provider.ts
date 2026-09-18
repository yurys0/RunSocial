import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

import { Injectable, Logger } from '@nestjs/common';
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
import { ADIDAS_SUPPORTED_SPORT_TYPE_IDS } from './sport-filters';
import { TrackerHttp } from './tracker-http';

/** Размер записи в бинарном GPS-треке и её раскладка — см. _decode_gps_trace в Python-версии */
const GPS_RECORD_SIZE = 38;

type RuntasticAuthResponse = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  me?: { guid?: string };
};

type RuntasticFeature = {
  type: string;
  attributes?: Record<string, unknown> | null;
};

type RuntasticActivity = {
  id: string;
  type: string;
  attributes: {
    duration?: number | null;
    start_time?: number | null;
    end_time?: number | null;
    /** Дистанции здесь нет — она приходит внутри features, см. extractDistanceMeters */
    features?: RuntasticFeature[] | null;
    [key: string]: unknown;
  };
  relationships?: {
    sport_type?: { data?: { id?: string } } | null;
  } | null;
};

type RuntasticActivitiesResponse = {
  data?: RuntasticActivity[] | null;
  links?: { next?: string | null } | null;
};

/** Порт исходного Python-клиента Runtastic; ADIDAS в нашем enum — это Adidas Running. */
@Injectable()
export class RuntasticProvider implements TrackerProvider {
  readonly provider = TrackerProviderName.ADIDAS;

  private readonly logger = new Logger(RuntasticProvider.name);
  private readonly appws: TrackerHttp;
  private readonly hubs: TrackerHttp;
  private readonly appKey: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config: ConfigService) {
    this.appKey = config.get<string>('RUNTASTIC_APP_KEY') ?? 'com.runtastic.android';
    const appVersion = config.get<string>('RUNTASTIC_APP_VERSION') ?? '13.46';
    const proxy = config.get<string>('RUNTASTIC_PROXY');
    const defaultHeaders = { 'X-App-Key': this.appKey, 'X-App-Version': appVersion };

    this.appws = new TrackerHttp('Runtastic:appws', {
      baseUrl: config.get<string>('RUNTASTIC_BASE_APPWS_URL') ?? 'https://appws.runtastic.com',
      proxy,
      defaultHeaders,
    });
    this.hubs = new TrackerHttp('Runtastic:hubs', {
      baseUrl: config.get<string>('RUNTASTIC_BASE_HUBS_URL') ?? 'https://hubs.runtastic.com',
      proxy,
      defaultHeaders,
    });
    this.clientId = config.get<string>('RUNTASTIC_CLIENT_ID') ?? '';
    this.clientSecret = config.get<string>('RUNTASTIC_CLIENT_SECRET') ?? '';
  }

  async authenticate(credentials: TrackerCredentials): Promise<TrackerSession> {
    const auth = await this.appws.postJson<RuntasticAuthResponse>(
      '/webapps/services/auth/v2/login/runtastic',
      {
        headers: { 'Content-Type': 'application/json', ...this.buildAuthHeaders() },
        rawBody: JSON.stringify({
          username: credentials.login,
          password: credentials.password,
          grant_type: 'password',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      },
    );

    const guid = auth.me?.guid;
    if (!auth.accessToken || !guid) {
      throw new TrackerAuthFailedError('Adidas Running');
    }

    return {
      accessToken: auth.accessToken,
      externalUserId: guid,
      providerData: { refreshToken: auth.refreshToken, expiresIn: auth.expiresIn },
    };
  }

  async fetchActivities(
    session: TrackerSession,
    since: Date | null,
    onProgress?: SyncProgressCallback,
  ): Promise<NormalizedActivity[]> {
    const activities = await this.fetchActivitiesPage(session);
    const runs = activities.filter((activity) => {
      const sportTypeId = activity.relationships?.sport_type?.data?.id;
      if (!sportTypeId || !ADIDAS_SUPPORTED_SPORT_TYPE_IDS.includes(sportTypeId)) {
        return false;
      }
      // Инкрементальный синк: у Runtastic нет параметра `since`, фильтруем на своей стороне
      const startTime = activity.attributes.start_time;
      return !since || (startTime != null && startTime > since.getTime());
    });

    const result: NormalizedActivity[] = [];
    for (const [index, activity] of runs.entries()) {
      const startTimeMs = activity.attributes.start_time ?? 0;
      result.push({
        externalId: activity.id,
        distanceMeters: this.extractDistanceMeters(activity),
        // duration приходит в миллисекундах
        durationSeconds: Math.round((activity.attributes.duration ?? 0) / 1000),
        startedAt: new Date(startTimeMs),
        endedAt: this.resolveEndedAt(activity, startTimeMs),
        routePoints: await this.fetchRoutePoints(session, activity.id, startTimeMs),
        rawPayload: activity,
      });
      onProgress?.(index + 1, runs.length);
    }
    return result;
  }

  private resolveEndedAt(activity: RuntasticActivity, startTimeMs: number): Date | null {
    const endTime = activity.attributes.end_time;
    if (typeof endTime !== 'number' || endTime <= startTimeMs) {
      return null;
    }
    return new Date(endTime);
  }

  /** Дистанция лежит не в attributes, а в features: track_metrics, запасной — initial_values. */
  private extractDistanceMeters(activity: RuntasticActivity): number {
    const features = activity.attributes.features ?? [];
    for (const featureType of ['track_metrics', 'initial_values']) {
      const value = features.find((feature) => feature.type === featureType)?.attributes?.distance;
      if (typeof value === 'number') {
        return Math.round(value);
      }
    }
    return 0;
  }

  /** Одна страница активностей — как в Python-версии; в ответе есть links.next. */
  private async fetchActivitiesPage(session: TrackerSession): Promise<RuntasticActivity[]> {
    const response = await this.hubs.getJson<RuntasticActivitiesResponse>(
      `/sport_activities/v2/users/${session.externalUserId}/sport_activities`,
      { headers: this.buildAuthHeaders(session.accessToken) },
    );
    return response.data ?? [];
  }

  private async fetchRoutePoints(
    session: TrackerSession,
    activityId: string,
    startTimeMs: number,
  ): Promise<RoutePoint[] | null> {
    const response = await this.hubs.get(
      `/sport_activities/v2/users/${session.externalUserId}/sport_activities/${activityId}/traces/gps`,
      { headers: this.buildAuthHeaders(session.accessToken) },
    );

    // 404 — трека просто нет, тело при этом JSON, а не бинарник
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new TrackerUnavailableError('Adidas Running', `трек недоступен (HTTP ${response.status})`);
    }

    let raw = Buffer.from(await response.arrayBuffer());
    try {
      raw = gunzipSync(raw);
    } catch {
      // Не gzip — значит пришёл несжатый бинарник, работаем с ним как есть
    }

    const points = this.decodeGpsTrace(raw, startTimeMs);
    return points.length ? points : null;
  }

  /**
   * Бинарный формат: 4 байта — число записей (big-endian int32), дальше записи по 38 байт
   * в раскладке '>qfffbbfiihh'. Долгота идёт ПЕРЕД широтой.
   */
  private decodeGpsTrace(data: Buffer, startTimeMs: number): RoutePoint[] {
    if (data.length < 4) {
      return [];
    }

    const declaredCount = data.readInt32BE(0);
    const availableCount = Math.floor((data.length - 4) / GPS_RECORD_SIZE);
    const count = Math.min(declaredCount, availableCount);
    if (count <= 0) {
      return [];
    }
    if (declaredCount !== availableCount) {
      this.logger.warn(`GPS-трек: заявлено ${declaredCount} записей, доступно ${availableCount}`);
    }

    const points: RoutePoint[] = [];
    let offset = 4;
    for (let i = 0; i < count; i++) {
      const timestampMs = Number(data.readBigInt64BE(offset));
      const longitude = data.readFloatBE(offset + 8);
      const latitude = data.readFloatBE(offset + 12);
      const altitude = data.readFloatBE(offset + 16);

      points.push({
        lat: latitude,
        lng: longitude,
        altitudeMeters: altitude,
        // В трек приходит абсолютный epoch в миллисекундах — приводим к смещению от старта
        timestampOffsetSec: Math.max(0, Math.round((timestampMs - startTimeMs) / 1000)),
      });
      offset += GPS_RECORD_SIZE;
    }
    return points;
  }

  /** Подпись: sha1('--{app_key}--{client_secret}--{X-Date}--'), X-Date — локальное время процесса. */
  private buildAuthHeaders(accessToken?: string): Record<string, string> {
    const xDate = this.formatDate(new Date());
    const signature = createHash('sha1')
      .update(`--${this.appKey}--${this.clientSecret}--${xDate}--`, 'utf8')
      .digest('hex');

    const headers: Record<string, string> = { 'X-Date': xDate, 'X-Auth-Token': signature };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
  }

  private formatDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return (
      `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  }
}

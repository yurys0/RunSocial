import { Pagination } from '../../shared/pagination/pagination';
import { RoutePoint } from '../../trackers/domain/tracker-provider.interface';
import { Activity } from './activity.entity';

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');

export type ImportActivityData = {
  userId: string;
  trackerAccountId: string;
  externalId: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
  startedAt: Date;
  endedAt: Date | null;
  routePoints: RoutePoint[] | null;
  rawPayload: unknown;
};

export type { Pagination };

export type UserActivityStats = {
  activityCount: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
};

export interface ActivityRepository {
  upsertMany(activities: ImportActivityData[]): Promise<{ created: number; updated: number }>;

  findById(id: string): Promise<Activity | null>;
  delete(id: string): Promise<void>;

  findFeed(userIds: string[], pagination: Pagination): Promise<Activity[]>;
  findByUser(userId: string, pagination: Pagination): Promise<Activity[]>;

  findRoutePoints(activityId: string): Promise<RoutePoint[] | null>;
  getUserStats(userId: string): Promise<UserActivityStats>;
}

import { Activity } from '../domain/activity.entity';

/** routePoints здесь нет: маршрут догружается отдельным резолвером. */
export type ActivityView = {
  id: string;
  userId: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
  startedAt: Date;
  endedAt: Date | null;
  likeCount: number;
  likedByMe: boolean;
};

export function toActivityView(
  activity: Activity,
  likeCount: number,
  likedByMe: boolean,
): ActivityView {
  return {
    id: activity.id,
    userId: activity.userId,
    distanceMeters: activity.distanceMeters,
    durationSeconds: activity.durationSeconds,
    avgPaceSecPerKm: activity.avgPaceSecPerKm,
    startedAt: activity.startedAt,
    endedAt: activity.endedAt,
    likeCount,
    likedByMe,
  };
}

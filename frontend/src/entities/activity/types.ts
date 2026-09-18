export type RoutePoint = {
  lat: number;
  lng: number;
  timestampOffsetSec: number;
};

export type ActivityAuthor = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
};

export type Activity = {
  id: string;
  userId: string;
  author: ActivityAuthor;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
  startedAt: string;
  endedAt: string | null;
  likeCount: number;
  likedByMe: boolean;
  routePoints?: RoutePoint[] | null;
};

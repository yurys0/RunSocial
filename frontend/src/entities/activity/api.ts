import { gql, rest } from '../../shared/api/client';
import { Activity } from './types';

/** Поля, общие для ленты и профиля; routePoints сюда не входит. */
const ACTIVITY_FIELDS = `
  id
  userId
  distanceMeters
  durationSeconds
  avgPaceSecPerKm
  startedAt
  endedAt
  likeCount
  likedByMe
  author { id login displayName avatarUrl }
`;

export async function fetchFeed(limit = 20, offset = 0): Promise<Activity[]> {
  const data = await gql<{ feed: Activity[] }>(
    `query Feed($limit: Int!, $offset: Int!) {
      feed(limit: $limit, offset: $offset) { ${ACTIVITY_FIELDS} }
    }`,
    { limit, offset },
  );
  return data.feed;
}

/** Маршрут запрашиваем только на странице конкретной пробежки. */
export async function fetchActivity(id: string): Promise<Activity> {
  const data = await gql<{ activity: Activity }>(
    `query Activity($id: String!) {
      activity(id: $id) {
        ${ACTIVITY_FIELDS}
        routePoints { lat lng timestampOffsetSec }
      }
    }`,
    { id },
  );
  return data.activity;
}

export function likeActivity(id: string): Promise<{ likeCount: number }> {
  return rest(`/activities/${id}/like`, { method: 'POST' });
}

export function unlikeActivity(id: string): Promise<{ likeCount: number }> {
  return rest(`/activities/${id}/like`, { method: 'DELETE' });
}

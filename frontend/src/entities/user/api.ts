import { gql, rest } from '../../shared/api/client';
import { Activity } from '../activity/types';

export type FriendshipStatus =
  | 'SELF'
  | 'NONE'
  | 'FRIENDS'
  | 'REQUEST_SENT'
  | 'REQUEST_RECEIVED';

export type UserProfile = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  stats: { activityCount: number; totalDistanceMeters: number; totalDurationSeconds: number };
  activities: Activity[];
  friendship: { status: FriendshipStatus; requestId: string | null };
  isPrivate: boolean;
  isVisible: boolean;
};

const PROFILE_FIELDS = `
  id
  login
  displayName
  avatarUrl
  createdAt
  isPrivate
  isVisible
  stats { activityCount totalDistanceMeters totalDurationSeconds }
  activities {
    id userId distanceMeters durationSeconds avgPaceSecPerKm startedAt endedAt likeCount likedByMe
    author { id login displayName avatarUrl }
  }
  friendship { status requestId }
`;

export async function fetchMyProfile(): Promise<UserProfile> {
  const data = await gql<{ me: UserProfile }>(`{ me(activitiesLimit: 20) { ${PROFILE_FIELDS} } }`);
  return data.me;
}

export async function fetchProfile(login: string): Promise<UserProfile> {
  const data = await gql<{ user: UserProfile }>(
    `query Profile($login: String!) {
      user(login: $login, activitiesLimit: 20) { ${PROFILE_FIELDS} }
    }`,
    { login },
  );
  return data.user;
}

export function updateDisplayName(displayName: string) {
  return rest('/users/me', { method: 'PATCH', body: { displayName } });
}

export function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('file', file);
  return rest('/users/me/avatar', { method: 'POST', body: form });
}

export function updatePrivacy(isPrivate: boolean) {
  return rest('/users/me/privacy', { method: 'PATCH', body: { isPrivate } });
}

export function deleteAvatar() {
  return rest('/users/me/avatar', { method: 'DELETE' });
}

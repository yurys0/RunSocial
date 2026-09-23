import { gql, rest } from '../../shared/api/client';

export type UserRole = 'USER' | 'ADMIN';

export type AdminUser = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  role: UserRole;
  createdAt: string;
  activityCount: number;
  trackerCount: number;
};

export type AdminTracker = {
  id: string;
  provider: string;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
};

export type AdminActivity = {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
  startedAt: string;
};

export type AdminUserDetails = AdminUser & {
  trackerAccounts: AdminTracker[];
  activities: AdminActivity[];
};

const USER_FIELDS = `
  id login displayName avatarUrl isPrivate role createdAt activityCount trackerCount
`;

export async function fetchUsers(query: string): Promise<AdminUser[]> {
  const data = await gql<{ adminUsers: AdminUser[] }>(
    `query AdminUsers($query: String!) { adminUsers(query: $query) { ${USER_FIELDS} } }`,
    { query },
  );
  return data.adminUsers;
}

export async function fetchUser(id: string): Promise<AdminUserDetails> {
  const data = await gql<{ adminUser: AdminUserDetails }>(
    `query AdminUser($id: ID!) {
      adminUser(id: $id) {
        ${USER_FIELDS}
        trackerAccounts { id provider status lastSyncAt createdAt }
        activities { id distanceMeters durationSeconds avgPaceSecPerKm startedAt }
      }
    }`,
    { id },
  );
  return data.adminUser;
}

export function updateUser(
  id: string,
  patch: { displayName?: string; login?: string; role?: UserRole },
) {
  return rest(`/users/${id}`, { method: 'PATCH', body: patch });
}

export function deleteUser(id: string) {
  return rest(`/users/${id}`, { method: 'DELETE' });
}

export function deleteUserAvatar(id: string) {
  return rest(`/users/${id}/avatar`, { method: 'DELETE' });
}

export function deleteActivity(id: string) {
  return rest(`/activities/${id}`, { method: 'DELETE' });
}

export function disconnectTracker(id: string) {
  return rest(`/trackers/${id}`, { method: 'DELETE' });
}

export function syncTracker(id: string) {
  return rest(`/trackers/${id}/syncs`, { method: 'POST' });
}

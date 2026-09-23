export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');

export type AdminUserRow = {
  id: string;
  login: string;
  displayName: string;
  avatarKey: string | null;
  isPrivate: boolean;
  createdAt: Date;
  activityCount: number;
  trackerCount: number;
};

export type AdminTrackerRow = {
  id: string;
  provider: string;
  status: string;
  externalUserId: string | null;
  lastSyncAt: Date | null;
  createdAt: Date;
};

export type AdminActivityRow = {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
  startedAt: Date;
};

export type AdminUserDetailsRow = AdminUserRow & {
  trackerAccounts: AdminTrackerRow[];
  activities: AdminActivityRow[];
};

export interface AdminRepository {
  listUsers(query: string, limit: number, offset: number): Promise<AdminUserRow[]>;
  findUser(id: string, activitiesLimit: number): Promise<AdminUserDetailsRow | null>;
}

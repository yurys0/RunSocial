import { avatarUrl } from '../../identity/application/avatar-url';
import { UserRole } from '../../identity/domain/user-role';
import {
  AdminActivityRow,
  AdminTrackerRow,
  AdminUserDetailsRow,
  AdminUserRow,
} from '../domain/admin.repository';

export type AdminUserView = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  role: UserRole;
  createdAt: Date;
  activityCount: number;
  trackerCount: number;
};

export type AdminUserDetailsView = AdminUserView & {
  trackerAccounts: AdminTrackerRow[];
  activities: AdminActivityRow[];
};

export function toAdminUserView(row: AdminUserRow, adminIds: Set<string>): AdminUserView {
  return {
    id: row.id,
    login: row.login,
    displayName: row.displayName,
    avatarUrl: avatarUrl(row.avatarKey),
    isPrivate: row.isPrivate,
    role: adminIds.has(row.id) ? UserRole.ADMIN : UserRole.USER,
    createdAt: row.createdAt,
    activityCount: row.activityCount,
    trackerCount: row.trackerCount,
  };
}

export function toAdminUserDetailsView(
  row: AdminUserDetailsRow,
  adminIds: Set<string>,
): AdminUserDetailsView {
  return {
    ...toAdminUserView(row, adminIds),
    trackerAccounts: row.trackerAccounts,
    activities: row.activities,
  };
}

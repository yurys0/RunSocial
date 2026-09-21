import { avatarUrl } from '../../identity/application/avatar-url';
import { User } from '../../identity/domain/user.entity';

export type UserSummary = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
};

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    login: user.login,
    displayName: user.displayName,
    avatarUrl: avatarUrl(user.avatarKey),
  };
}

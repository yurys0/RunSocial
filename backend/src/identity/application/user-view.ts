import { User } from '../domain/user.entity';
import { avatarUrl } from './avatar-url';

export type UserView = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  createdAt: Date;
};

export function toUserView(user: User): UserView {
  return {
    id: user.id,
    login: user.login,
    displayName: user.displayName,
    avatarUrl: avatarUrl(user.avatarKey),
    isPrivate: user.isPrivate,
    createdAt: user.createdAt,
  };
}

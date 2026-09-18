import { User } from '../../identity/domain/user.entity';
import { S3Service } from '../../shared/storage/s3.service';

export type UserSummary = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
};

export function toUserSummary(user: User, s3: S3Service): UserSummary {
  return {
    id: user.id,
    login: user.login,
    displayName: user.displayName,
    avatarUrl: user.avatarKey ? s3.publicUrl(user.avatarKey) : null,
  };
}

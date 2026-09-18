import { S3Service } from '../../shared/storage/s3.service';
import { User } from '../domain/user.entity';

export type UserView = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  createdAt: Date;
};

export function toUserView(user: User, s3: S3Service): UserView {
  return {
    id: user.id,
    login: user.login,
    displayName: user.displayName,
    // В БД лежит ключ объекта: полный URL собираем на отдаче, чтобы смена провайдера
    avatarUrl: user.avatarKey ? s3.publicUrl(user.avatarKey) : null,
    isPrivate: user.isPrivate,
    createdAt: user.createdAt,
  };
}

import { ApiProperty } from '@nestjs/swagger';

import { User } from '../domain/user.entity';
import { avatarUrl } from './avatar-url';

// класс, а не type — иначе Swagger не видит поля ответа
export class UserView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'runner' })
  login: string;

  @ApiProperty({ example: 'Иван Петров' })
  displayName: string;

  @ApiProperty({ nullable: true, type: String, description: 'Ссылка на аватарку; null, если не загружена' })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Закрытый профиль: пробежки видны только друзьям' })
  isPrivate: boolean;

  @ApiProperty()
  createdAt: Date;
}

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

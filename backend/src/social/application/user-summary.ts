import { ApiProperty } from '@nestjs/swagger';

import { avatarUrl } from '../../identity/application/avatar-url';
import { User } from '../../identity/domain/user.entity';

export class UserSummary {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'runner' })
  login: string;

  @ApiProperty({ example: 'Иван Петров' })
  displayName: string;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl: string | null;
}

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    login: user.login,
    displayName: user.displayName,
    avatarUrl: avatarUrl(user.avatarKey),
  };
}

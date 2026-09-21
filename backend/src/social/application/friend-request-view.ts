import { ApiProperty } from '@nestjs/swagger';

import { UserSummary } from './user-summary';

export class FriendRequestView {
  @ApiProperty({ format: 'uuid', description: 'Идентификатор заявки' })
  id: string;

  @ApiProperty({ type: UserSummary, description: 'Во входящих — отправитель, в исходящих — получатель' })
  user: UserSummary;

  @ApiProperty()
  createdAt: Date;
}

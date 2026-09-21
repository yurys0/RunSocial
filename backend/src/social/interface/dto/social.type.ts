import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { FriendLinkStatus } from '@prisma/client';

import { FriendshipStatus } from '../../domain/friendship-status';

registerEnumType(FriendshipStatus, { name: 'FriendshipStatus' });

registerEnumType(FriendLinkStatus, {
  name: 'FriendLinkStatus',
  description: 'Состояние записи о заявке: ждёт ответа, принята, отклонена',
});

@ObjectType('Friendship')
export class FriendshipType {
  @Field(() => FriendshipStatus)
  status: FriendshipStatus;

  @Field(() => ID, { nullable: true })
  requestId?: string | null;
}

@ObjectType('UserSummary')
export class UserSummaryType {
  @Field(() => ID)
  id: string;

  @Field()
  login: string;

  @Field()
  displayName: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;
}

@ObjectType('UserSearchResult')
export class UserSearchResultType extends UserSummaryType {
  @Field(() => FriendshipType)
  friendship: FriendshipType;
}

@ObjectType('FriendRequest')
export class FriendRequestType {
  @Field(() => ID)
  id: string;

  /** Во входящих — отправитель, в исходящих — получатель */
  @Field(() => UserSummaryType)
  user: UserSummaryType;

  @Field()
  createdAt: Date;
}

@ObjectType('FriendRequestResult', { description: 'Итог операции над заявкой в друзья' })
export class FriendRequestResultType {
  @Field(() => ID, { description: 'Идентификатор заявки' })
  id: string;

  @Field(() => FriendLinkStatus, { description: 'Состояние заявки после операции' })
  status: FriendLinkStatus;
}

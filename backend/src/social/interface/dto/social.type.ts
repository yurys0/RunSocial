import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { FriendLinkStatus } from '@prisma/client';

import { FriendshipStatus } from '../../domain/friendship-status';

registerEnumType(FriendshipStatus, {
  name: 'FriendshipStatus',
  description: 'Состояние отношений между двумя пользователями',
});

registerEnumType(FriendLinkStatus, {
  name: 'FriendLinkStatus',
  description: 'Состояние записи о заявке: ждёт ответа, принята, отклонена',
});

@ObjectType('Friendship', { description: 'Отношение текущего пользователя к другому' })
export class FriendshipType {
  @Field(() => FriendshipStatus, { description: 'SELF — это сам пользователь, NONE — связи нет, REQUEST_SENT и REQUEST_RECEIVED — заявка ждёт ответа, FRIENDS — друзья' })
  status: FriendshipStatus;

  @Field(() => ID, { nullable: true, description: 'Идентификатор входящей заявки; заполнен только для REQUEST_RECEIVED, по нему её принимают или отклоняют' })
  requestId?: string | null;
}

@ObjectType('UserSummary', { description: 'Краткая карточка пользователя' })
export class UserSummaryType {
  @Field(() => ID, { description: 'Идентификатор пользователя' })
  id: string;

  @Field({ description: 'Логин' })
  login: string;

  @Field({ description: 'Отображаемое имя' })
  displayName: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на аватарку; null, если не загружена' })
  avatarUrl?: string | null;
}

@ObjectType('UserSearchResult', { description: 'Пользователь в результатах поиска' })
export class UserSearchResultType extends UserSummaryType {
  @Field(() => FriendshipType, { description: 'Отношение текущего пользователя к найденному' })
  friendship: FriendshipType;
}

@ObjectType('FriendRequest', { description: 'Заявка в друзья, ожидающая ответа' })
export class FriendRequestType {
  @Field(() => ID, { description: 'Идентификатор заявки' })
  id: string;

  @Field(() => UserSummaryType, { description: 'Во входящих — отправитель, в исходящих — получатель' })
  user: UserSummaryType;

  @Field({ description: 'Когда отправлена' })
  createdAt: Date;
}

@ObjectType('FriendRequestResult', { description: 'Итог операции над заявкой в друзья' })
export class FriendRequestResultType {
  @Field(() => ID, { description: 'Идентификатор заявки' })
  id: string;

  @Field(() => FriendLinkStatus, { description: 'Состояние заявки после операции' })
  status: FriendLinkStatus;
}

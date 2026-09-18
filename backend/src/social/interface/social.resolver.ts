import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { GqlAuthGuard } from '../../shared/auth/gql-auth.guard';
import { AuthenticatedUser } from '../../shared/auth/jwt-auth.guard';
import { ListFriendsUseCase } from '../application/list-friends.use-case';
import { SearchUsersUseCase } from '../application/search-users.use-case';
import { FriendRequestType, UserSearchResultType, UserSummaryType } from './dto/social.type';

@Resolver()
@UseGuards(GqlAuthGuard)
export class SocialResolver {
  constructor(
    private readonly searchUsers: SearchUsersUseCase,
    private readonly listFriends: ListFriendsUseCase,
  ) {}

  // Имя поля задано явно: метод нельзя назвать searchUsers — так называется внедрённый use-case
  @Query(() => [UserSearchResultType], {
    name: 'searchUsers',
    description: 'Пользователи: без query — все, с query — поиск по логину или имени',
  })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Args('query', { defaultValue: '' }) query: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
  ) {
    return this.searchUsers.execute(query, user.userId, limit);
  }

  @Query(() => [UserSummaryType], { description: 'Список друзей' })
  friends(@CurrentUser() user: AuthenticatedUser) {
    return this.listFriends.friends(user.userId);
  }

  @Query(() => [FriendRequestType], { description: 'Входящие заявки в друзья' })
  incomingFriendRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.listFriends.incoming(user.userId);
  }

  @Query(() => [FriendRequestType], { description: 'Отправленные заявки, ожидающие ответа' })
  outgoingFriendRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.listFriends.outgoing(user.userId);
  }
}

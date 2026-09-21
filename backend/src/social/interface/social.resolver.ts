import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { GqlAuthGuard } from '../../shared/auth/gql-auth.guard';
import { AuthenticatedUser } from '../../shared/auth/jwt-auth.guard';
import { CancelFriendRequestUseCase } from '../application/cancel-friend-request.use-case';
import { ListFriendsUseCase } from '../application/list-friends.use-case';
import { RemoveFriendUseCase } from '../application/remove-friend.use-case';
import { RespondFriendRequestUseCase } from '../application/respond-friend-request.use-case';
import { SearchUsersUseCase } from '../application/search-users.use-case';
import { SendFriendRequestUseCase } from '../application/send-friend-request.use-case';
import {
  FriendRequestResultType,
  FriendRequestType,
  UserSearchResultType,
  UserSummaryType,
} from './dto/social.type';

// для списков без аргумента limit
const LIST_ESTIMATE = 20;

@Resolver()
@UseGuards(GqlAuthGuard)
export class SocialResolver {
  constructor(
    private readonly searchUsers: SearchUsersUseCase,
    private readonly listFriends: ListFriendsUseCase,
    private readonly sendRequest: SendFriendRequestUseCase,
    private readonly respondRequest: RespondFriendRequestUseCase,
    private readonly cancelRequest: CancelFriendRequestUseCase,
    private readonly removeFriendUseCase: RemoveFriendUseCase,
  ) {}

  // Имя поля задано явно: метод нельзя назвать searchUsers — так называется внедрённый use-case
  @Query(() => [UserSearchResultType], {
    name: 'searchUsers',
    description: 'Пользователи: без query — все, с query — поиск по логину или имени',
    complexity: ({ args, childComplexity }) => childComplexity * (args.limit as number),
  })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Args('query', { defaultValue: '' }) query: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
  ) {
    return this.searchUsers.execute(query, user.userId, limit);
  }

  @Query(() => [UserSummaryType], {
    description: 'Список друзей',
    complexity: ({ childComplexity }) => childComplexity * LIST_ESTIMATE,
  })
  friends(@CurrentUser() user: AuthenticatedUser) {
    return this.listFriends.friends(user.userId);
  }

  @Query(() => [FriendRequestType], {
    description: 'Входящие заявки в друзья',
    complexity: ({ childComplexity }) => childComplexity * LIST_ESTIMATE,
  })
  incomingFriendRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.listFriends.incoming(user.userId);
  }

  @Query(() => [FriendRequestType], {
    description: 'Отправленные заявки, ожидающие ответа',
    complexity: ({ childComplexity }) => childComplexity * LIST_ESTIMATE,
  })
  outgoingFriendRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.listFriends.outgoing(user.userId);
  }

  @Mutation(() => FriendRequestResultType, { description: 'Отправить заявку в друзья по логину' })
  sendFriendRequest(@CurrentUser() user: AuthenticatedUser, @Args('login') login: string) {
    return this.sendRequest.execute(user.userId, { login });
  }

  @Mutation(() => FriendRequestResultType, { description: 'Принять входящую заявку' })
  acceptFriendRequest(@CurrentUser() user: AuthenticatedUser, @Args('id') id: string) {
    return this.respondRequest.accept(user.userId, id);
  }

  @Mutation(() => FriendRequestResultType, { description: 'Отклонить входящую заявку' })
  declineFriendRequest(@CurrentUser() user: AuthenticatedUser, @Args('id') id: string) {
    return this.respondRequest.decline(user.userId, id);
  }

  @Mutation(() => Boolean, { description: 'Отменить свою заявку, пока на неё не ответили' })
  async cancelFriendRequest(@CurrentUser() user: AuthenticatedUser, @Args('id') id: string) {
    await this.cancelRequest.execute(user.userId, id);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Удалить пользователя из друзей' })
  async removeFriend(@CurrentUser() user: AuthenticatedUser, @Args('userId') userId: string) {
    await this.removeFriendUseCase.execute(user.userId, userId);
    return true;
  }
}

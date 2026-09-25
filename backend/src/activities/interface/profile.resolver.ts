import { UseGuards } from '@nestjs/common';
import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { GqlAuthGuard } from '../../shared/auth/gql-auth.guard';
import { GetFriendshipUseCase } from '../../social/application/get-friendship.use-case';
import { Friendship } from '../../social/domain/friendship-status';
import { FriendshipType } from '../../social/interface/dto/social.type';
import { GetUserProfileUseCase } from '../application/get-user-profile.use-case';
import { UserProfileType } from './dto/user-profile.type';

@Resolver(() => UserProfileType)
@UseGuards(GqlAuthGuard)
export class ProfileResolver {
  constructor(
    private readonly getProfile: GetUserProfileUseCase,
    private readonly getFriendship: GetFriendshipUseCase,
  ) {}

  @Query(() => UserProfileType, { description: 'Свой профиль' })
  me(
    @CurrentUser() user: AuthenticatedUser,
    @Args('activitiesLimit', { type: () => Int, defaultValue: 10 }) activitiesLimit: number,
  ) {
    return this.getProfile.byId(user.userId, user.userId, activitiesLimit);
  }

  @Query(() => UserProfileType, { description: 'Профиль другого пользователя по логину' })
  user(
    @CurrentUser() viewer: AuthenticatedUser,
    @Args('login') login: string,
    @Args('activitiesLimit', { type: () => Int, defaultValue: 10 }) activitiesLimit: number,
  ) {
    return this.getProfile.byLogin(login, viewer.userId, activitiesLimit);
  }

  @ResolveField(() => FriendshipType)
  friendship(
    @CurrentUser() viewer: AuthenticatedUser,
    @Parent() profile: UserProfileType,
  ): Promise<Friendship> {
    return this.getFriendship.execute(viewer.userId, profile.id);
  }
}

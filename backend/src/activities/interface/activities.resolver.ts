import { Inject, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { avatarUrl } from '../../identity/application/avatar-url';
import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { GqlAuthGuard } from '../../shared/auth/gql-auth.guard';
import { MAX_PAGE_SIZE } from '../../shared/pagination/pagination';
import { GetActivityUseCase } from '../application/get-activity.use-case';
import { GetFeedUseCase } from '../application/get-feed.use-case';
import { LikeActivityUseCase } from '../application/like-activity.use-case';
import { ActivityNotFoundError } from '../domain/activities.errors';
import { ActivityAuthorType, ActivityType, LikeResultType, RoutePointType } from './dto/activity.type';

@Resolver(() => ActivityType)
@UseGuards(GqlAuthGuard)
export class ActivitiesResolver {
  constructor(
    private readonly getFeed: GetFeedUseCase,
    private readonly getActivity: GetActivityUseCase,
    private readonly likeActivity: LikeActivityUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  @Query(() => [ActivityType], {
    description: 'Лента: свои пробежки и пробежки друзей',
    complexity: ({ args, childComplexity }) => childComplexity * (args.limit as number),
  })
  feed(
    @CurrentUser() user: AuthenticatedUser,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ) {
    return this.getFeed.execute(user.userId, {
      limit: Math.min(limit, MAX_PAGE_SIZE),
      offset: Math.max(offset, 0),
    });
  }

  @Query(() => ActivityType, { description: 'Одна пробежка; закрытый чужой профиль даёт «не найдена»' })
  activity(@CurrentUser() user: AuthenticatedUser, @Args('id') id: string) {
    return this.getActivity.execute(id, user.userId);
  }

  @Mutation(() => LikeResultType, { name: 'likeActivity', description: 'Поставить лайк чужой пробежке' })
  like(@CurrentUser() user: AuthenticatedUser, @Args('id') id: string) {
    return this.likeActivity.like(user.userId, id);
  }

  @Mutation(() => LikeResultType, { description: 'Снять свой лайк' })
  unlikeActivity(@CurrentUser() user: AuthenticatedUser, @Args('id') id: string) {
    return this.likeActivity.unlike(user.userId, id);
  }

  @ResolveField(() => [RoutePointType], { nullable: true })
  routePoints(@CurrentUser() user: AuthenticatedUser, @Parent() activity: ActivityType) {
    return this.getActivity.getRoutePoints(activity.id, user.userId);
  }

  @ResolveField(() => ActivityAuthorType)
  async author(@Parent() activity: ActivityType): Promise<ActivityAuthorType> {
    const user = await this.users.findById(activity.userId);
    if (!user) {
      throw new ActivityNotFoundError();
    }
    return {
      id: user.id,
      login: user.login,
      displayName: user.displayName,
      avatarUrl: avatarUrl(user.avatarKey),
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { CanViewProfileUseCase } from '../../social/application/can-view-profile.use-case';
import { CACHE_KEYS, PROFILE_TTL_SECONDS } from '../../dashboard/application/cache-keys';
import { avatarUrl } from '../../identity/application/avatar-url';
import { UserNotFoundError } from '../../identity/domain/identity.errors';
import { CacheService } from '../../shared/cache/cache.service';
import { User } from '../../identity/domain/user.entity';
import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { ACTIVITY_REPOSITORY, ActivityRepository } from '../domain/activity.repository';
import { ActivityView } from './activity-view';
import { GetUserActivitiesUseCase } from './get-user-activities.use-case';

export type UserProfile = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  isPrivate: boolean;
  isVisible: boolean;
  stats: { activityCount: number; totalDistanceMeters: number; totalDurationSeconds: number };
  activities: ActivityView[];
};

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ACTIVITY_REPOSITORY) private readonly activities: ActivityRepository,
    private readonly userActivities: GetUserActivitiesUseCase,
    private readonly cache: CacheService,
    private readonly canViewProfile: CanViewProfileUseCase,
  ) {}

  async byLogin(login: string, viewerId: string, activitiesLimit: number): Promise<UserProfile> {
    const user = await this.users.findByLogin(login);
    if (!user) {
      throw new UserNotFoundError();
    }
    return this.build(user, viewerId, activitiesLimit);
  }

  async byId(userId: string, viewerId: string, activitiesLimit: number): Promise<UserProfile> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return this.build(user, viewerId, activitiesLimit);
  }

  private async build(
    user: User,
    viewerId: string,
    activitiesLimit: number,
  ): Promise<UserProfile> {
    const cached = await this.cache.wrap(
      CACHE_KEYS.profile(user.id),
      PROFILE_TTL_SECONDS,
      async () => ({
        id: user.id,
        login: user.login,
        displayName: user.displayName,
        avatarUrl: avatarUrl(user.avatarKey),
        createdAt: user.createdAt,
        isPrivate: user.isPrivate,
        stats: await this.activities.getUserStats(user.id),
      }),
    );

    const isVisible = await this.canViewProfile.execute(viewerId, user.id, user.isPrivate);
    const base = { ...cached, createdAt: new Date(cached.createdAt), isVisible };

    if (!isVisible) {
      return {
        ...base,
        stats: { activityCount: 0, totalDistanceMeters: 0, totalDurationSeconds: 0 },
        activities: [],
      };
    }

    return {
      ...base,
      activities: await this.userActivities.execute(user.id, viewerId, {
        limit: activitiesLimit,
        offset: 0,
      }),
    };
  }
}

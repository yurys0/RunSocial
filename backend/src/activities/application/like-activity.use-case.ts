import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  ACTIVITY_LIKED_EVENT,
  ActivityLikedEvent,
} from '../../shared/events/domain-events';
import {
  ACTIVITY_LIKE_REPOSITORY,
  ActivityLikeRepository,
} from '../domain/activity-like.repository';
import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { CanViewProfileUseCase } from '../../social/application/can-view-profile.use-case';
import { ACTIVITY_REPOSITORY, ActivityRepository } from '../domain/activity.repository';
import {
  ActivityNotFoundError,
  AlreadyLikedError,
  CannotLikeOwnActivityError,
  LikeNotFoundError,
} from '../domain/activities.errors';

@Injectable()
export class LikeActivityUseCase {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activities: ActivityRepository,
    @Inject(ACTIVITY_LIKE_REPOSITORY) private readonly likes: ActivityLikeRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly events: EventEmitter2,
    private readonly canViewProfile: CanViewProfileUseCase,
  ) {}

  async like(userId: string, activityId: string): Promise<{ likeCount: number }> {
    const activity = await this.activities.findById(activityId);
    if (!activity) {
      throw new ActivityNotFoundError();
    }
    if (activity.userId === userId) {
      throw new CannotLikeOwnActivityError();
    }
    const owner = await this.users.findById(activity.userId);
    if (!owner || !(await this.canViewProfile.execute(userId, activity.userId, owner.isPrivate))) {
      throw new ActivityNotFoundError();
    }
    if (await this.likes.exists(userId, activityId)) {
      throw new AlreadyLikedError();
    }

    await this.likes.like(userId, activityId);
    this.events.emit(ACTIVITY_LIKED_EVENT, new ActivityLikedEvent(activity.userId, activityId));
    return this.countFor(activityId);
  }

  async unlike(userId: string, activityId: string): Promise<{ likeCount: number }> {
    if (!(await this.likes.exists(userId, activityId))) {
      throw new LikeNotFoundError();
    }
    await this.likes.unlike(userId, activityId);

    const activity = await this.activities.findById(activityId);
    if (activity) {
      this.events.emit(ACTIVITY_LIKED_EVENT, new ActivityLikedEvent(activity.userId, activityId));
    }

    return this.countFor(activityId);
  }

  private async countFor(activityId: string): Promise<{ likeCount: number }> {
    const counts = await this.likes.countForActivities([activityId]);
    return { likeCount: counts.get(activityId) ?? 0 };
  }
}

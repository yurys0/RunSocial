import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { CanViewProfileUseCase } from '../../social/application/can-view-profile.use-case';
import { RoutePoint } from '../../trackers/domain/tracker-provider.interface';
import { ACTIVITY_REPOSITORY, ActivityRepository } from '../domain/activity.repository';
import { ActivityNotFoundError } from '../domain/activities.errors';
import { ActivityEnricher } from './activity-enricher';
import { ActivityView } from './activity-view';

@Injectable()
export class GetActivityUseCase {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activities: ActivityRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly enricher: ActivityEnricher,
    private readonly canViewProfile: CanViewProfileUseCase,
  ) {}

  async execute(activityId: string, viewerId: string): Promise<ActivityView> {
    const activity = await this.activities.findById(activityId);
    if (!activity) {
      throw new ActivityNotFoundError();
    }
    await this.assertVisible(activity.userId, viewerId);
    const [view] = await this.enricher.enrich([activity], viewerId);
    return view;
  }

  async getRoutePoints(activityId: string, viewerId: string): Promise<RoutePoint[] | null> {
    const activity = await this.activities.findById(activityId);
    if (!activity) {
      throw new ActivityNotFoundError();
    }
    await this.assertVisible(activity.userId, viewerId);
    return this.activities.findRoutePoints(activityId);
  }

  /** Ссылку можно открыть минуя профиль, поэтому доступ проверяется здесь. Закрытая — «не найдена». */
  private async assertVisible(ownerId: string, viewerId: string): Promise<void> {
    const owner = await this.users.findById(ownerId);
    if (!owner) {
      throw new ActivityNotFoundError();
    }
    if (!(await this.canViewProfile.execute(viewerId, ownerId, owner.isPrivate))) {
      throw new ActivityNotFoundError();
    }
  }
}

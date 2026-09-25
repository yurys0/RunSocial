import { Inject, Injectable } from '@nestjs/common';

import { UserNotFoundError } from '../../identity/domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { CanViewProfileUseCase } from '../../social/application/can-view-profile.use-case';
import { ACTIVITY_REPOSITORY, ActivityRepository, Pagination } from '../domain/activity.repository';
import { ProfileIsPrivateError } from '../domain/activities.errors';
import { ActivityEnricher } from './activity-enricher';
import { ActivityView } from './activity-view';

@Injectable()
export class GetUserActivitiesUseCase {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activities: ActivityRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly enricher: ActivityEnricher,
    private readonly canViewProfile: CanViewProfileUseCase,
  ) {}

  async execute(
    ownerId: string,
    viewerId: string,
    pagination: Pagination,
  ): Promise<ActivityView[]> {
    const activities = await this.activities.findByUser(ownerId, pagination);
    return this.enricher.enrich(activities, viewerId);
  }

  async byLogin(login: string, viewerId: string, pagination: Pagination): Promise<ActivityView[]> {
    const owner = await this.users.findByLogin(login);
    if (!owner) {
      throw new UserNotFoundError();
    }
    if (!(await this.canViewProfile.execute(viewerId, owner.id, owner.isPrivate))) {
      throw new ProfileIsPrivateError();
    }
    return this.execute(owner.id, viewerId, pagination);
  }
}

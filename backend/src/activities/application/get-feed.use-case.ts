import { Inject, Injectable } from '@nestjs/common';

import { GetFriendIdsUseCase } from '../../social/application/get-friend-ids.use-case';
import { ACTIVITY_REPOSITORY, ActivityRepository, Pagination } from '../domain/activity.repository';
import { ActivityEnricher } from './activity-enricher';
import { ActivityView } from './activity-view';

@Injectable()
export class GetFeedUseCase {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activities: ActivityRepository,
    private readonly friends: GetFriendIdsUseCase,
    private readonly enricher: ActivityEnricher,
  ) {}

  async execute(userId: string, pagination: Pagination): Promise<ActivityView[]> {
    const friendIds = await this.friends.execute(userId);
    const activities = await this.activities.findFeed([userId, ...friendIds], pagination);
    return this.enricher.enrich(activities, userId);
  }
}

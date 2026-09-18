import { Inject, Injectable } from '@nestjs/common';

import { ACTIVITY_REPOSITORY, ActivityRepository, Pagination } from '../domain/activity.repository';
import { ActivityEnricher } from './activity-enricher';
import { ActivityView } from './activity-view';

@Injectable()
export class GetUserActivitiesUseCase {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activities: ActivityRepository,
    private readonly enricher: ActivityEnricher,
  ) {}

  async execute(
    ownerId: string,
    viewerId: string,
    pagination: Pagination,
  ): Promise<ActivityView[]> {
    const activities = await this.activities.findByUser(ownerId, pagination);
    return this.enricher.enrich(activities, viewerId);
  }
}

import { Inject, Injectable } from '@nestjs/common';

import {
  ACTIVITY_LIKE_REPOSITORY,
  ActivityLikeRepository,
} from '../domain/activity-like.repository';
import { Activity } from '../domain/activity.entity';
import { ActivityView, toActivityView } from './activity-view';

@Injectable()
export class ActivityEnricher {
  constructor(
    @Inject(ACTIVITY_LIKE_REPOSITORY) private readonly likes: ActivityLikeRepository,
  ) {}

  async enrich(activities: Activity[], viewerId: string): Promise<ActivityView[]> {
    const ids = activities.map((activity) => activity.id);
    const [counts, liked] = await Promise.all([
      this.likes.countForActivities(ids),
      this.likes.likedByUser(viewerId, ids),
    ]);

    return activities.map((activity) =>
      toActivityView(activity, counts.get(activity.id) ?? 0, liked.has(activity.id)),
    );
  }
}

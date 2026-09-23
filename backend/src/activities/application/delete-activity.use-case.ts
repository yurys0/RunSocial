import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import {
  ACTIVITIES_REMOVED_EVENT,
  ActivitiesRemovedEvent,
} from '../../shared/events/domain-events';
import { ActivityNotFoundError, ForeignActivityError } from '../domain/activities.errors';
import { ACTIVITY_REPOSITORY, ActivityRepository } from '../domain/activity.repository';

@Injectable()
export class DeleteActivityUseCase {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activities: ActivityRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(actor: AuthenticatedUser, activityId: string): Promise<void> {
    const activity = await this.activities.findById(activityId);
    if (!activity) {
      throw new ActivityNotFoundError();
    }
    if (activity.userId !== actor.userId && !actor.isAdmin) {
      throw new ForeignActivityError();
    }

    await this.activities.delete(activityId);
    this.events.emit(ACTIVITIES_REMOVED_EVENT, new ActivitiesRemovedEvent(activity.userId));
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NormalizedActivity } from '../../trackers/domain/tracker-provider.interface';
import { calculateAvgPaceSecPerKm } from '../domain/activity.entity';
import {
  ACTIVITY_IMPORTED_EVENT,
  ActivityImportedEvent,
} from '../../shared/events/domain-events';
import { ACTIVITY_REPOSITORY, ActivityRepository } from '../domain/activity.repository';

/** Единственная точка записи активностей: Trackers не пишет в Activity напрямую. */
@Injectable()
export class ImportActivitiesUseCase {
  private readonly logger = new Logger(ImportActivitiesUseCase.name);

  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activities: ActivityRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    userId: string,
    trackerAccountId: string,
    normalized: NormalizedActivity[],
  ): Promise<{ created: number; updated: number }> {
    if (normalized.length === 0) {
      return { created: 0, updated: 0 };
    }

    const result = await this.activities.upsertMany(
      normalized.map((activity) => ({
        userId,
        trackerAccountId,
        externalId: activity.externalId,
        distanceMeters: activity.distanceMeters,
        durationSeconds: activity.durationSeconds,
        avgPaceSecPerKm: calculateAvgPaceSecPerKm(activity.distanceMeters, activity.durationSeconds),
        startedAt: activity.startedAt,
        endedAt: activity.endedAt,
        routePoints: activity.routePoints,
        rawPayload: activity.rawPayload,
      })),
    );

    this.logger.log(
      `Импорт для пользователя ${userId}: новых ${result.created}, обновлено ${result.updated}`,
    );
    this.events.emit(ACTIVITY_IMPORTED_EVENT, new ActivityImportedEvent(userId, result.created));
    return result;
  }
}

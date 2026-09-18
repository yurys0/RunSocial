import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { CacheService } from '../../shared/cache/cache.service';
import {
  ACTIVITY_IMPORTED_EVENT,
  ACTIVITY_LIKED_EVENT,
  PROFILE_UPDATED_EVENT,
  PROFILE_VISIBILITY_CHANGED_EVENT,
  ActivityImportedEvent,
  ActivityLikedEvent,
  ProfileUpdatedEvent,
  ProfileVisibilityChangedEvent,
} from '../../shared/events/domain-events';
import { CACHE_KEYS } from './cache-keys';

/** Инвалидация кэша по доменным событиям, а не по одному лишь TTL. */
@Injectable()
export class DashboardCacheListener {
  private readonly logger = new Logger(DashboardCacheListener.name);

  constructor(private readonly cache: CacheService) {}

  @OnEvent(ACTIVITY_IMPORTED_EVENT)
  async onActivityImported(event: ActivityImportedEvent): Promise<void> {
    if (event.importedCount === 0) {
      return; // ничего нового не появилось — кэш всё ещё актуален
    }
    await this.cache.del(...CACHE_KEYS.allLandings(), CACHE_KEYS.profile(event.userId));
    this.logger.log(`Кэш сброшен: импортировано ${event.importedCount} активностей`);
  }

  @OnEvent(ACTIVITY_LIKED_EVENT)
  async onActivityLiked(event: ActivityLikedEvent): Promise<void> {
    // Лайк не меняет агрегаты лендинга — сбрасываем только профиль владельца
    await this.cache.del(CACHE_KEYS.profile(event.activityOwnerId));
  }

  @OnEvent(PROFILE_UPDATED_EVENT)
  async onProfileUpdated(event: ProfileUpdatedEvent): Promise<void> {
    await this.cache.del(CACHE_KEYS.profile(event.userId));
  }

  @OnEvent(PROFILE_VISIBILITY_CHANGED_EVENT)
  async onVisibilityChanged(event: ProfileVisibilityChangedEvent): Promise<void> {
    await this.cache.del(...CACHE_KEYS.allLandings(), CACHE_KEYS.profile(event.userId));
    this.logger.log(`Профиль ${event.userId} сменил видимость, кэш лендинга сброшен`);
  }
}

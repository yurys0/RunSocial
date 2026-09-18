/** События слушают инвалидаторы кэша. Кэш общий, поэтому межпроцессная шина не нужна. */

export const ACTIVITY_IMPORTED_EVENT = 'activity.imported';
export const ACTIVITY_LIKED_EVENT = 'activity.liked';
export const PROFILE_UPDATED_EVENT = 'profile.updated';
export const PROFILE_VISIBILITY_CHANGED_EVENT = 'profile.visibility-changed';

export class ActivityImportedEvent {
  constructor(
    readonly userId: string,
    readonly importedCount: number,
  ) {}
}

export class ActivityLikedEvent {
  constructor(
    readonly activityOwnerId: string,
    readonly activityId: string,
  ) {}
}

export class ProfileUpdatedEvent {
  constructor(readonly userId: string) {}
}

/** Смена видимости меняет и лендинг: закрытые профили в публичную статистику не входят. */
export class ProfileVisibilityChangedEvent {
  constructor(readonly userId: string) {}
}

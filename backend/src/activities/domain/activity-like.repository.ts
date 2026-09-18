export const ACTIVITY_LIKE_REPOSITORY = Symbol('ACTIVITY_LIKE_REPOSITORY');

export interface ActivityLikeRepository {
  like(userId: string, activityId: string): Promise<void>;
  unlike(userId: string, activityId: string): Promise<void>;
  exists(userId: string, activityId: string): Promise<boolean>;
  countForActivities(activityIds: string[]): Promise<Map<string, number>>;
  likedByUser(userId: string, activityIds: string[]): Promise<Set<string>>;
}

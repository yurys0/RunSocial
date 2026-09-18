import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

import { FriendshipType } from '../../../social/interface/dto/social.type';
import { ActivityType } from './activity.type';

@ObjectType('UserStats')
export class UserStatsType {
  @Field(() => Int)
  activityCount: number;

  @Field(() => Int)
  totalDistanceMeters: number;

  @Field(() => Int)
  totalDurationSeconds: number;
}

@ObjectType('UserProfile')
export class UserProfileType {
  @Field(() => ID)
  id: string;

  @Field()
  login: string;

  @Field()
  displayName: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  isPrivate: boolean;

  @Field()
  isVisible: boolean;

  @Field(() => UserStatsType)
  stats: UserStatsType;

  @Field(() => [ActivityType])
  activities: ActivityType[];

  @Field(() => FriendshipType)
  friendship: FriendshipType;
}

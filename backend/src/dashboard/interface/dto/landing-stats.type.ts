import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { StatsPeriod } from '../../domain/dashboard.types';

registerEnumType(StatsPeriod, { name: 'StatsPeriod' });

@ObjectType('TopRunner')
export class TopRunnerType {
  @Field(() => ID)
  userId: string;

  @Field()
  login: string;

  @Field()
  displayName: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field(() => Int)
  totalDistanceMeters: number;

  @Field(() => Int)
  activityCount: number;
}

@ObjectType('LandingStats')
export class LandingStatsType {
  @Field(() => StatsPeriod)
  period: StatsPeriod;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalActivities: number;

  @Field(() => Int)
  totalDistanceMeters: number;

  @Field(() => [TopRunnerType])
  topByDistance: TopRunnerType[];

  @Field(() => [TopRunnerType])
  topByActivityCount: TopRunnerType[];
}

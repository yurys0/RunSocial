import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('RoutePoint')
export class RoutePointType {
  @Field(() => Float)
  lat: number;

  @Field(() => Float)
  lng: number;

  @Field(() => Float, { nullable: true })
  altitudeMeters: number | null;

  /** Секунды от начала пробежки, не абсолютное время */
  @Field(() => Int)
  timestampOffsetSec: number;
}

@ObjectType('ActivityAuthor')
export class ActivityAuthorType {
  @Field(() => ID)
  id: string;

  @Field()
  login: string;

  @Field()
  displayName: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;
}

@ObjectType('Activity')
export class ActivityType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => Int)
  distanceMeters: number;

  @Field(() => Int)
  durationSeconds: number;

  @Field(() => Int)
  avgPaceSecPerKm: number;

  @Field()
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  endedAt?: Date | null;

  @Field(() => Int)
  likeCount: number;

  @Field()
  likedByMe: boolean;

  @Field(() => ActivityAuthorType)
  author: ActivityAuthorType;

  /** Читается из БД только при явном запросе поля — в списках не поднимается. */
  @Field(() => [RoutePointType], { nullable: true })
  routePoints?: RoutePointType[] | null;
}

@ObjectType('LikeResult', { description: 'Итог лайка или его снятия' })
export class LikeResultType {
  @Field(() => Int, { description: 'Число лайков после операции' })
  likeCount: number;
}

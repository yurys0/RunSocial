import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('RoutePoint', { description: 'Точка GPS-трека пробежки' })
export class RoutePointType {
  @Field(() => Float, { description: 'Широта в градусах' })
  lat: number;

  @Field(() => Float, { description: 'Долгота в градусах' })
  lng: number;

  @Field(() => Float, { nullable: true, description: 'Высота над уровнем моря в метрах; null, если трекер её не отдал' })
  altitudeMeters: number | null;

  @Field(() => Int, { description: 'Секунды от начала пробежки, не абсолютное время' })
  timestampOffsetSec: number;
}

@ObjectType('ActivityAuthor', { description: 'Автор пробежки в ленте' })
export class ActivityAuthorType {
  @Field(() => ID, { description: 'Идентификатор пользователя' })
  id: string;

  @Field({ description: 'Логин' })
  login: string;

  @Field({ description: 'Отображаемое имя' })
  displayName: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на аватарку; null, если не загружена' })
  avatarUrl?: string | null;
}

@ObjectType('Activity', { description: 'Пробежка, импортированная из трекера' })
export class ActivityType {
  @Field(() => ID, { description: 'Идентификатор пробежки' })
  id: string;

  @Field(() => ID, { description: 'Идентификатор владельца' })
  userId: string;

  @Field(() => Int, { description: 'Дистанция в метрах' })
  distanceMeters: number;

  @Field(() => Int, { description: 'Время движения в секундах, без пауз' })
  durationSeconds: number;

  @Field(() => Int, { description: 'Средний темп: секунд на километр' })
  avgPaceSecPerKm: number;

  @Field({ description: 'Начало пробежки' })
  startedAt: Date;

  @Field(() => Date, { nullable: true, description: 'Фактическое окончание по данным трекера; null, если трекер не сообщил' })
  endedAt?: Date | null;

  @Field(() => Int, { description: 'Число лайков' })
  likeCount: number;

  @Field({ description: 'Лайкнул ли текущий пользователь' })
  likedByMe: boolean;

  @Field(() => ActivityAuthorType, { description: 'Автор пробежки' })
  author: ActivityAuthorType;

  @Field(() => [RoutePointType], {
    nullable: true,
    description: 'Маршрут; читается из БД только при явном запросе поля. null, если трекер не отдал трек',
    complexity: 50,
  })
  routePoints?: RoutePointType[] | null;
}

@ObjectType('LikeResult', { description: 'Итог лайка или его снятия' })
export class LikeResultType {
  @Field(() => Int, { description: 'Число лайков после операции' })
  likeCount: number;
}

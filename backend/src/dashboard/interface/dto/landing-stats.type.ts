import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { StatsPeriod } from '../../domain/dashboard.types';

registerEnumType(StatsPeriod, {
  name: 'StatsPeriod',
  description: 'Период статистики: неделя, месяц или всё время',
});

@ObjectType('TopRunner', { description: 'Строка рейтинга бегунов на лендинге' })
export class TopRunnerType {
  @Field(() => ID, { description: 'Идентификатор пользователя' })
  userId: string;

  @Field({ description: 'Логин' })
  login: string;

  @Field({ description: 'Отображаемое имя' })
  displayName: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на аватарку; null, если не загружена' })
  avatarUrl?: string | null;

  @Field(() => Int, { description: 'Дистанция за период в метрах' })
  totalDistanceMeters: number;

  @Field(() => Int, { description: 'Число пробежек за период' })
  activityCount: number;
}

@ObjectType('LandingStats', { description: 'Публичная статистика для лендинга; закрытые профили не учитываются' })
export class LandingStatsType {
  @Field(() => StatsPeriod, { description: 'Период, за который посчитана статистика' })
  period: StatsPeriod;

  @Field(() => Int, { description: 'Число зарегистрированных пользователей' })
  totalUsers: number;

  @Field(() => Int, { description: 'Число пробежек за период' })
  totalActivities: number;

  @Field(() => Int, { description: 'Суммарная дистанция за период в метрах' })
  totalDistanceMeters: number;

  @Field(() => [TopRunnerType], {
    description: 'Топ-10 по дистанции',
  })
  topByDistance: TopRunnerType[];

  @Field(() => [TopRunnerType], {
    description: 'Топ-10 по числу пробежек',
  })
  topByActivityCount: TopRunnerType[];
}

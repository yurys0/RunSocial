import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

import { FriendshipType } from '../../../social/interface/dto/social.type';
import { ActivityType } from './activity.type';

@ObjectType('UserStats', { description: 'Сводная статистика пробежек пользователя' })
export class UserStatsType {
  @Field(() => Int, { description: 'Число пробежек' })
  activityCount: number;

  @Field(() => Int, { description: 'Суммарная дистанция в метрах' })
  totalDistanceMeters: number;

  @Field(() => Int, { description: 'Суммарное время движения в секундах' })
  totalDurationSeconds: number;
}

@ObjectType('UserProfile', { description: 'Страница профиля: свой или чужой' })
export class UserProfileType {
  @Field(() => ID, { description: 'Идентификатор пользователя' })
  id: string;

  @Field({ description: 'Логин' })
  login: string;

  @Field({ description: 'Отображаемое имя' })
  displayName: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на аватарку; null, если не загружена' })
  avatarUrl?: string | null;

  @Field({ description: 'Дата регистрации' })
  createdAt: Date;

  @Field({ description: 'Закрытый профиль: пробежки видны только друзьям' })
  isPrivate: boolean;

  @Field({ description: 'Видны ли пробежки текущему пользователю: владельцу и друзьям — всегда, остальным — если профиль открыт' })
  isVisible: boolean;

  @Field(() => UserStatsType, { description: 'Статистика пробежек; нули, если профиль скрыт' })
  stats: UserStatsType;

  @Field(() => [ActivityType], {
    description: 'Последние пробежки, число задаётся аргументом activitiesLimit',
  })
  activities: ActivityType[];

  @Field(() => FriendshipType, { description: 'Отношение текущего пользователя к владельцу профиля' })
  friendship: FriendshipType;
}

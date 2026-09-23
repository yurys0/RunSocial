import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { UserRole } from '../../../identity/domain/user-role';
import { TrackerAccountType } from '../../../trackers/interface/dto/tracker.type';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'ADMIN открывает админку и управление чужими данными',
});

@ObjectType('AdminUser', { description: 'Строка списка пользователей в админке' })
export class AdminUserType {
  @Field(() => ID, { description: 'Идентификатор пользователя' })
  id: string;

  @Field({ description: 'Логин' })
  login: string;

  @Field({ description: 'Отображаемое имя' })
  displayName: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на аватарку; null, если не загружена' })
  avatarUrl: string | null;

  @Field({ description: 'Закрытый профиль' })
  isPrivate: boolean;

  @Field(() => UserRole, { description: 'Роль пользователя' })
  role: UserRole;

  @Field({ description: 'Дата регистрации' })
  createdAt: Date;

  @Field(() => Int, { description: 'Сколько пробежек импортировано' })
  activityCount: number;

  @Field(() => Int, { description: 'Сколько трекеров привязано' })
  trackerCount: number;
}

@ObjectType('AdminActivity', { description: 'Пробежка в карточке пользователя' })
export class AdminActivityType {
  @Field(() => ID, { description: 'Идентификатор пробежки' })
  id: string;

  @Field(() => Int, { description: 'Дистанция в метрах' })
  distanceMeters: number;

  @Field(() => Int, { description: 'Время движения в секундах' })
  durationSeconds: number;

  @Field(() => Int, { description: 'Средний темп в секундах на километр' })
  avgPaceSecPerKm: number;

  @Field({ description: 'Когда начата' })
  startedAt: Date;
}

@ObjectType('AdminUserDetails', { description: 'Карточка пользователя: трекеры и последние пробежки' })
export class AdminUserDetailsType extends AdminUserType {
  @Field(() => [TrackerAccountType], { description: 'Привязанные трекеры' })
  trackerAccounts: TrackerAccountType[];

  @Field(() => [AdminActivityType], { description: 'Последние пробежки' })
  activities: AdminActivityType[];
}

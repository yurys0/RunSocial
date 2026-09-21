import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, MaxLength, MinLength } from 'class-validator';

@ObjectType('User', { description: 'Собственный аккаунт после изменения профиля' })
export class UserType {
  @Field(() => ID, { description: 'Идентификатор пользователя' })
  id: string;

  @Field({ description: 'Логин' })
  login: string;

  @Field({ description: 'Отображаемое имя' })
  displayName: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на аватарку; null, если не загружена' })
  avatarUrl: string | null;

  @Field({ description: 'Закрытый профиль: пробежки видны только друзьям' })
  isPrivate: boolean;

  @Field({ description: 'Дата регистрации' })
  createdAt: Date;
}

@InputType({ description: 'Изменяемые поля профиля' })
export class UpdateProfileInput {
  @Field({ description: 'Отображаемое имя, от 1 до 100 символов' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;
}

import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { TrackerAccountStatus, TrackerProviderName } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

registerEnumType(TrackerProviderName, {
  name: 'TrackerProviderName',
  description: 'Поддерживаемые трекеры; ADIDAS — Adidas Running (Runtastic)',
});

registerEnumType(TrackerAccountStatus, {
  name: 'TrackerAccountStatus',
  description: 'ERROR — последняя синхронизация упала',
});

@ObjectType('TrackerAccount', { description: 'Привязка внешнего трекера к аккаунту' })
export class TrackerAccountType {
  @Field(() => ID, { description: 'Идентификатор привязки' })
  id: string;

  @Field(() => TrackerProviderName, { description: 'Какой трекер' })
  provider: string;

  @Field(() => TrackerAccountStatus, { description: 'Состояние привязки' })
  status: string;

  @Field(() => String, { nullable: true, description: 'Идентификатор пользователя на стороне трекера' })
  externalUserId: string | null;

  @Field(() => Date, { nullable: true, description: 'Когда последний раз синхронизировались' })
  lastSyncAt: Date | null;

  @Field({ description: 'Когда привязан' })
  createdAt: Date;
}

@ObjectType('SyncStarted', { description: 'Синхронизация поставлена в очередь' })
export class SyncStartedType {
  @Field({ description: 'Идентификатор задачи; прогресс приходит в SSE /trackers/syncs/events' })
  jobId: string;
}

@InputType({ description: 'Учётные данные трекера; хранятся зашифрованными' })
export class ConnectTrackerInput {
  @Field(() => TrackerProviderName, { description: 'Какой трекер привязать' })
  @IsEnum(TrackerProviderName)
  provider: TrackerProviderName;

  @Field({ description: 'Логин в трекере' })
  @IsString()
  @MinLength(1)
  login: string;

  @Field({ description: 'Пароль от трекера' })
  @IsString()
  @MinLength(1)
  password: string;
}

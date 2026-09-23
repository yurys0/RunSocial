import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { GqlAuthGuard } from '../../shared/auth/gql-auth.guard';
import { ConnectTrackerUseCase } from '../application/connect-tracker.use-case';
import { DisconnectTrackerUseCase } from '../application/disconnect-tracker.use-case';
import { InitiateSyncUseCase } from '../application/initiate-sync.use-case';
import { ListTrackerAccountsUseCase } from '../application/list-tracker-accounts.use-case';
import { ConnectTrackerInput, SyncStartedType, TrackerAccountType } from './dto/tracker.type';

@Resolver(() => TrackerAccountType)
@UseGuards(GqlAuthGuard)
export class TrackersResolver {
  constructor(
    private readonly listAccounts: ListTrackerAccountsUseCase,
    private readonly connect: ConnectTrackerUseCase,
    private readonly disconnect: DisconnectTrackerUseCase,
    private readonly initiateSync: InitiateSyncUseCase,
  ) {}

  @Query(() => [TrackerAccountType], { description: 'Привязанные трекеры текущего пользователя' })
  myTrackers(@CurrentUser() user: AuthenticatedUser) {
    return this.listAccounts.execute(user.userId);
  }

  @Mutation(() => TrackerAccountType, { description: 'Привязать трекер; логин и пароль проверяются сразу' })
  connectTracker(@CurrentUser() user: AuthenticatedUser, @Args('input') input: ConnectTrackerInput) {
    return this.connect.execute(user.userId, input);
  }

  @Mutation(() => Boolean, { description: 'Отвязать трекер вместе с импортированными пробежками' })
  async disconnectTracker(@CurrentUser() user: AuthenticatedUser, @Args('id') id: string) {
    await this.disconnect.execute(user, id);
    return true;
  }

  @Mutation(() => SyncStartedType, { description: 'Запустить синхронизацию: задача уходит в очередь' })
  startTrackerSync(@CurrentUser() user: AuthenticatedUser, @Args('id') id: string) {
    return this.initiateSync.execute(user, id);
  }
}

import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { VerifySession } from 'supertokens-nestjs';

import { GqlAuthGuard } from '../../shared/auth/gql-auth.guard';
import { ADMIN_ROLE } from '../../shared/auth/roles';
import { GetUserUseCase } from '../application/get-user.use-case';
import { ListUsersUseCase } from '../application/list-users.use-case';
import { AdminUserDetailsType, AdminUserType } from './dto/admin.type';

@Resolver(() => AdminUserType)
@UseGuards(GqlAuthGuard)
export class AdminResolver {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
  ) {}

  @Query(() => [AdminUserType], { description: 'Пользователи с поиском по логину и имени' })
  @VerifySession({ roles: [ADMIN_ROLE] })
  adminUsers(
    @Args('query', { defaultValue: '' }) query: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ) {
    return this.listUsers.execute(query, Math.min(limit, 100), offset);
  }

  @Query(() => AdminUserDetailsType, { description: 'Карточка пользователя для админки' })
  @VerifySession({ roles: [ADMIN_ROLE] })
  adminUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('activitiesLimit', { type: () => Int, defaultValue: 20 }) activitiesLimit: number,
  ) {
    return this.getUser.execute(id, activitiesLimit);
  }
}

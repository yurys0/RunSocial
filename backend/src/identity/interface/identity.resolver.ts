import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { GqlAuthGuard } from '../../shared/auth/gql-auth.guard';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import { UpdateProfileInput, UserType } from './dto/user.type';

@Resolver(() => UserType)
@UseGuards(GqlAuthGuard)
export class IdentityResolver {
  constructor(private readonly updateUser: UpdateUserUseCase) {}

  @Mutation(() => UserType, { description: 'Изменить отображаемое имя' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Args('input') input: UpdateProfileInput) {
    return this.updateUser.execute(user, user.userId, input);
  }

  @Mutation(() => UserType, { description: 'Закрыть профиль: пробежки увидят только друзья' })
  makeProfilePrivate(@CurrentUser() user: AuthenticatedUser) {
    return this.updateUser.setPrivacy(user, true);
  }

  @Mutation(() => UserType, { description: 'Открыть профиль для всех' })
  makeProfilePublic(@CurrentUser() user: AuthenticatedUser) {
    return this.updateUser.setPrivacy(user, false);
  }
}

import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { GqlAuthGuard } from '../../shared/auth/gql-auth.guard';
import { AuthenticatedUser } from '../../shared/auth/jwt-auth.guard';
import { UpdateProfileUseCase } from '../application/update-profile.use-case';
import { UpdateProfileInput, UserType } from './dto/user.type';

// чтение профиля — в ProfileResolver модуля activities
@Resolver(() => UserType)
@UseGuards(GqlAuthGuard)
export class IdentityResolver {
  constructor(private readonly updateProfileUseCase: UpdateProfileUseCase) {}

  @Mutation(() => UserType, { description: 'Изменить отображаемое имя' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Args('input') input: UpdateProfileInput) {
    return this.updateProfileUseCase.execute(user.userId, input);
  }

  @Mutation(() => UserType, { description: 'Закрыть профиль: пробежки увидят только друзья' })
  makeProfilePrivate(@CurrentUser() user: AuthenticatedUser) {
    return this.updateProfileUseCase.setPrivacy(user.userId, true);
  }

  @Mutation(() => UserType, { description: 'Открыть профиль для всех' })
  makeProfilePublic(@CurrentUser() user: AuthenticatedUser) {
    return this.updateProfileUseCase.setPrivacy(user.userId, false);
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import { ForeignProfileError, UserNotFoundError } from '../domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { toUserView, UserView } from './user-view';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(actor: AuthenticatedUser, userId: string): Promise<UserView> {
    if (actor.userId !== userId && !actor.isAdmin) {
      throw new ForeignProfileError();
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return toUserView(user);
  }
}

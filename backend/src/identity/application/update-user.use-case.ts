import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import {
  PROFILE_UPDATED_EVENT,
  PROFILE_VISIBILITY_CHANGED_EVENT,
  ProfileUpdatedEvent,
  ProfileVisibilityChangedEvent,
} from '../../shared/events/domain-events';
import { ACCOUNT_GATEWAY, AccountGateway } from '../domain/account.gateway';
import {
  AdminRightsRequiredError,
  CannotChangeOwnRoleError,
  ForeignProfileError,
  UserNotFoundError,
} from '../domain/identity.errors';
import { UserRole } from '../domain/user-role';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { UpdateUserDto } from './dto/profile.dto';
import { toUserView, UserView } from './user-view';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ACCOUNT_GATEWAY) private readonly accounts: AccountGateway,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    targetUserId: string,
    dto: UpdateUserDto,
  ): Promise<UserView> {
    const isSelf = actor.userId === targetUserId;
    if (!isSelf && !actor.isAdmin) {
      throw new ForeignProfileError();
    }
    if ((dto.login !== undefined || dto.role !== undefined) && !actor.isAdmin) {
      throw new AdminRightsRequiredError();
    }

    const user = await this.users.findById(targetUserId);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (dto.role !== undefined) {
      if (isSelf && dto.role !== UserRole.ADMIN) {
        throw new CannotChangeOwnRoleError();
      }
      await this.accounts.setAdmin(targetUserId, dto.role === UserRole.ADMIN);
    }

    if (dto.login !== undefined && dto.login !== user.login) {
      await this.accounts.changeLogin(targetUserId, dto.login);
      user.changeLogin(dto.login);
    }
    if (dto.displayName !== undefined) {
      user.rename(dto.displayName);
    }
    if (dto.isPrivate !== undefined) {
      user.setPrivate(dto.isPrivate);
    }

    const saved = await this.users.save(user);

    if (dto.displayName !== undefined || dto.login !== undefined) {
      this.events.emit(PROFILE_UPDATED_EVENT, new ProfileUpdatedEvent(targetUserId));
    }
    if (dto.isPrivate !== undefined) {
      this.events.emit(
        PROFILE_VISIBILITY_CHANGED_EVENT,
        new ProfileVisibilityChangedEvent(targetUserId),
      );
    }
    return toUserView(saved);
  }

  setPrivacy(actor: AuthenticatedUser, isPrivate: boolean): Promise<UserView> {
    return this.execute(actor, actor.userId, { isPrivate });
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import {
  ACTIVITIES_REMOVED_EVENT,
  ActivitiesRemovedEvent,
} from '../../shared/events/domain-events';
import { S3Service } from '../../shared/storage/s3.service';
import { ACCOUNT_GATEWAY, AccountGateway } from '../domain/account.gateway';
import {
  AdminRightsRequiredError,
  CannotDeleteYourselfError,
  UserNotFoundError,
} from '../domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';

@Injectable()
export class DeleteUserUseCase {
  private readonly logger = new Logger(DeleteUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ACCOUNT_GATEWAY) private readonly accounts: AccountGateway,
    private readonly s3: S3Service,
    private readonly events: EventEmitter2,
  ) {}

  /** Пробежки, лайки, заявки и привязки трекеров уходят каскадом на уровне БД. */
  async execute(actor: AuthenticatedUser, targetUserId: string): Promise<void> {
    if (!actor.isAdmin) {
      throw new AdminRightsRequiredError();
    }
    if (actor.userId === targetUserId) {
      throw new CannotDeleteYourselfError();
    }

    const user = await this.users.findById(targetUserId);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.avatarKey) {
      try {
        await this.s3.deleteObject(user.avatarKey);
      } catch (error) {
        this.logger.warn(`Не удалось удалить аватарку ${user.avatarKey}: ${String(error)}`);
      }
    }

    await this.accounts.delete(targetUserId);
    await this.users.delete(targetUserId);
    this.events.emit(ACTIVITIES_REMOVED_EVENT, new ActivitiesRemovedEvent(targetUserId));
  }
}

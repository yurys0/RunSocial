import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  PROFILE_UPDATED_EVENT,
  PROFILE_VISIBILITY_CHANGED_EVENT,
  ProfileUpdatedEvent,
  ProfileVisibilityChangedEvent,
} from '../../shared/events/domain-events';
import { UserNotFoundError } from '../domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { UpdateProfileDto } from './dto/profile.dto';
import { toUserView, UserView } from './user-view';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (dto.displayName !== undefined) {
      user.rename(dto.displayName);
    }
    if (dto.isPrivate !== undefined) {
      user.setPrivate(dto.isPrivate);
    }

    const saved = await this.users.save(user);

    if (dto.displayName !== undefined) {
      this.events.emit(PROFILE_UPDATED_EVENT, new ProfileUpdatedEvent(userId));
    }
    if (dto.isPrivate !== undefined) {
      // Сбрасываем и профиль, и лендинг: состав публичной статистики изменился
      this.events.emit(
        PROFILE_VISIBILITY_CHANGED_EVENT,
        new ProfileVisibilityChangedEvent(userId),
      );
    }
    return toUserView(saved);
  }

  setPrivacy(userId: string, isPrivate: boolean): Promise<UserView> {
    return this.execute(userId, { isPrivate });
  }
}

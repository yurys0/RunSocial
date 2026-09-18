import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  PROFILE_UPDATED_EVENT,
  PROFILE_VISIBILITY_CHANGED_EVENT,
  ProfileUpdatedEvent,
  ProfileVisibilityChangedEvent,
} from '../../shared/events/domain-events';
import { S3Service } from '../../shared/storage/s3.service';
import { UserNotFoundError } from '../domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { UpdateProfileDto } from './dto/profile.dto';
import { toUserView, UserView } from './user-view';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly s3: S3Service,
    private readonly events: EventEmitter2,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    user.rename(dto.displayName);
    const saved = await this.users.save(user);
    this.events.emit(PROFILE_UPDATED_EVENT, new ProfileUpdatedEvent(userId));
    return toUserView(saved, this.s3);
  }

  async setPrivacy(userId: string, isPrivate: boolean): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    user.setPrivate(isPrivate);
    const saved = await this.users.save(user);
    // Сбрасываем и профиль, и лендинг: состав публичной статистики изменился
    this.events.emit(
      PROFILE_VISIBILITY_CHANGED_EVENT,
      new ProfileVisibilityChangedEvent(userId),
    );
    return toUserView(saved, this.s3);
  }
}

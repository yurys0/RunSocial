import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import {
  PROFILE_UPDATED_EVENT,
  ProfileUpdatedEvent,
} from '../../shared/events/domain-events';
import { S3Service, StoredObject } from '../../shared/storage/s3.service';
import {
  AvatarNotFoundError,
  ForeignProfileError,
  UserNotFoundError,
} from '../domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { toUserView, UserView } from './user-view';

export type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
};

@Injectable()
export class AvatarUseCase {
  private readonly logger = new Logger(AvatarUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly s3: S3Service,
    private readonly events: EventEmitter2,
  ) {}

  async upload(userId: string, file: UploadedImage): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const key = `avatars/${userId}/${randomUUID()}`;
    await this.s3.putObject(key, file.buffer, file.mimetype);

    const previousKey = user.avatarKey;
    user.attachAvatar(key);
    const saved = await this.users.save(user);

    if (previousKey) {
      await this.deleteQuietly(previousKey);
    }
    this.events.emit(PROFILE_UPDATED_EVENT, new ProfileUpdatedEvent(userId));
    return toUserView(saved);
  }

  async open(userId: string, fileId: string): Promise<StoredObject> {
    const object = await this.s3.getObject(`avatars/${userId}/${fileId}`);
    if (!object) {
      throw new AvatarNotFoundError();
    }
    return object;
  }

  async remove(actor: AuthenticatedUser, userId: string): Promise<UserView> {
    if (actor.userId !== userId && !actor.isAdmin) {
      throw new ForeignProfileError();
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const key = user.avatarKey;
    user.detachAvatar();
    const saved = await this.users.save(user);

    if (key) {
      await this.deleteQuietly(key);
    }
    this.events.emit(PROFILE_UPDATED_EVENT, new ProfileUpdatedEvent(userId));
    return toUserView(saved);
  }

  private async deleteQuietly(key: string) {
    try {
      await this.s3.deleteObject(key);
    } catch (error) {
      this.logger.warn(`Не удалось удалить объект ${key}: ${String(error)}`);
    }
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  PROFILE_UPDATED_EVENT,
  ProfileUpdatedEvent,
} from '../../shared/events/domain-events';
import { S3Service } from '../../shared/storage/s3.service';
import {
  AvatarObjectInvalidError,
  ForeignAvatarKeyError,
  UserNotFoundError,
} from '../domain/identity.errors';
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES } from './dto/profile.dto';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { toUserView, UserView } from './user-view';

/** Загрузка в два шага: выдаём presigned URL, браузер грузит файл в S3 и подтверждает ключ. */
@Injectable()
export class AvatarUseCase {
  private readonly logger = new Logger(AvatarUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly s3: S3Service,
    private readonly events: EventEmitter2,
  ) {}

  async createUploadUrl(userId: string, contentType: string, contentLength: number) {
    const { uploadUrl, key } = await this.s3.createAvatarUploadUrl(
      userId,
      contentType,
      contentLength,
    );
    return { uploadUrl, key };
  }

  async confirm(userId: string, key: string): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Префикс содержит id владельца — подставить чужой объект не выйдет
    if (!key.startsWith(`avatars/${userId}/`)) {
      throw new ForeignAvatarKeyError();
    }

    // Загружал браузер, поэтому проверяем сам объект: есть ли он, тип и размер
    const head = await this.s3.headObject(key);
    if (!head) {
      throw new AvatarObjectInvalidError('файл не найден в хранилище');
    }
    if (!head.contentType || !ALLOWED_AVATAR_TYPES.includes(head.contentType)) {
      await this.deleteQuietly(key);
      throw new AvatarObjectInvalidError(`недопустимый тип файла: ${head.contentType ?? 'неизвестен'}`);
    }
    if ((head.contentLength ?? 0) > MAX_AVATAR_BYTES) {
      await this.deleteQuietly(key);
      throw new AvatarObjectInvalidError('файл больше допустимого размера');
    }

    const previousKey = user.avatarKey;
    user.attachAvatar(key);
    const saved = await this.users.save(user);

    if (previousKey && previousKey !== key) {
      await this.deleteQuietly(previousKey);
    }
    this.events.emit(PROFILE_UPDATED_EVENT, new ProfileUpdatedEvent(userId));
    return toUserView(saved, this.s3);
  }

  async remove(userId: string): Promise<UserView> {
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
    return toUserView(saved, this.s3);
  }

  private async deleteQuietly(key: string) {
    try {
      await this.s3.deleteObject(key);
    } catch (error) {
      this.logger.warn(`Не удалось удалить объект ${key}: ${String(error)}`);
    }
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { FriendLinkStatus } from '@prisma/client';

import { UserNotFoundError } from '../../identity/domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { RedisService } from '../../shared/redis/redis.service';
import { FriendLink } from '../domain/friend-link.entity';
import { FRIEND_LINK_REPOSITORY, FriendLinkRepository } from '../domain/friend-link.repository';
import {
  AlreadyFriendsError,
  CannotFriendYourselfError,
  FriendRequestAlreadySentError,
  IncomingRequestExistsError,
} from '../domain/social.errors';
import { FriendEvent, friendEventsChannel } from '../infrastructure/friend-events';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Injectable()
export class SendFriendRequestUseCase {
  constructor(
    @Inject(FRIEND_LINK_REPOSITORY) private readonly friendLinks: FriendLinkRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly redis: RedisService,
  ) {}

  async execute(fromUserId: string, dto: SendFriendRequestDto): Promise<{ id: string; status: string }> {
    const target = await this.users.findByLogin(dto.login);
    if (!target) {
      throw new UserNotFoundError();
    }
    if (target.id === fromUserId) {
      throw new CannotFriendYourselfError();
    }

    const existing = await this.friendLinks.findBetween(fromUserId, target.id);
    const link = existing
      ? await this.reuse(existing, fromUserId)
      : await this.friendLinks.create(fromUserId, target.id);

    const sender = await this.users.findById(fromUserId);
    if (sender) {
      const event: FriendEvent = {
        type: 'request_received',
        requestId: link.id,
        from: { id: sender.id, login: sender.login, displayName: sender.displayName },
      };
      await this.redis.publish(friendEventsChannel(target.id), event);
    }

    return { id: link.id, status: link.status };
  }

  private async reuse(existing: FriendLink, fromUserId: string): Promise<FriendLink> {
    if (existing.status === FriendLinkStatus.ACCEPTED) {
      throw new AlreadyFriendsError();
    }
    if (existing.status === FriendLinkStatus.PENDING) {
      throw existing.fromUserId === fromUserId
        ? new FriendRequestAlreadySentError()
        : new IncomingRequestExistsError();
    }

    existing.renew();
    return this.friendLinks.save(existing);
  }
}

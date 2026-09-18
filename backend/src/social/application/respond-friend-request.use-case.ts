import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { RedisService } from '../../shared/redis/redis.service';
import { FRIEND_LINK_REPOSITORY, FriendLinkRepository } from '../domain/friend-link.repository';
import { FriendRequestNotFoundError } from '../domain/social.errors';
import { FriendEvent, friendEventsChannel } from '../infrastructure/friend-events';

@Injectable()
export class RespondFriendRequestUseCase {
  constructor(
    @Inject(FRIEND_LINK_REPOSITORY) private readonly friendLinks: FriendLinkRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly redis: RedisService,
  ) {}

  async accept(userId: string, requestId: string): Promise<{ id: string; status: string }> {
    const link = await this.loadPending(userId, requestId);
    link.accept();
    const saved = await this.friendLinks.save(link);

    const recipient = await this.users.findById(userId);
    if (recipient) {
      const event: FriendEvent = {
        type: 'request_accepted',
        requestId: saved.id,
        by: { id: recipient.id, login: recipient.login, displayName: recipient.displayName },
      };
      await this.redis.publish(friendEventsChannel(saved.fromUserId), event);
    }

    return { id: saved.id, status: saved.status };
  }

  async decline(userId: string, requestId: string): Promise<{ id: string; status: string }> {
    const link = await this.loadPending(userId, requestId);
    link.decline();
    const saved = await this.friendLinks.save(link);
    return { id: saved.id, status: saved.status };
  }

  /** Чужая заявка даёт 404, а не 403: иначе по коду ответа можно узнать, что она существует. */
  private async loadPending(userId: string, requestId: string) {
    const link = await this.friendLinks.findById(requestId);
    if (!link || !link.isPendingFor(userId)) {
      throw new FriendRequestNotFoundError();
    }
    return link;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { FriendLinkStatus } from '@prisma/client';

import { FRIEND_LINK_REPOSITORY, FriendLinkRepository } from '../domain/friend-link.repository';
import { FriendRequestNotFoundError } from '../domain/social.errors';

@Injectable()
export class CancelFriendRequestUseCase {
  constructor(@Inject(FRIEND_LINK_REPOSITORY) private readonly friendLinks: FriendLinkRepository) {}

  async execute(userId: string, requestId: string): Promise<void> {
    const link = await this.friendLinks.findById(requestId);
    const isOwnPending =
      link && link.status === FriendLinkStatus.PENDING && link.fromUserId === userId;
    if (!isOwnPending) {
      throw new FriendRequestNotFoundError();
    }
    await this.friendLinks.delete(link.id);
  }
}

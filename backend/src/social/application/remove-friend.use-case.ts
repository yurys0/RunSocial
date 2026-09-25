import { Inject, Injectable } from '@nestjs/common';
import { FriendLinkStatus } from '@prisma/client';

import { FRIEND_LINK_REPOSITORY, FriendLinkRepository } from '../domain/friend-link.repository';
import { FriendRequestNotFoundError } from '../domain/social.errors';

@Injectable()
export class RemoveFriendUseCase {
  constructor(@Inject(FRIEND_LINK_REPOSITORY) private readonly friendLinks: FriendLinkRepository) {}

  async execute(userId: string, otherUserId: string): Promise<void> {
    const link = await this.friendLinks.findBetween(userId, otherUserId);
    if (!link || link.status !== FriendLinkStatus.ACCEPTED) {
      throw new FriendRequestNotFoundError();
    }
    await this.friendLinks.delete(link.id);
  }
}

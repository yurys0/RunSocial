import { Inject, Injectable } from '@nestjs/common';
import { FriendLinkStatus } from '@prisma/client';

import { FRIEND_LINK_REPOSITORY, FriendLinkRepository } from '../domain/friend-link.repository';
import { Friendship, FriendshipStatus } from '../domain/friendship-status';

@Injectable()
export class GetFriendshipUseCase {
  constructor(@Inject(FRIEND_LINK_REPOSITORY) private readonly friendLinks: FriendLinkRepository) {}

  async execute(viewerId: string, targetUserId: string): Promise<Friendship> {
    if (viewerId === targetUserId) {
      return { status: FriendshipStatus.SELF, requestId: null };
    }

    const link = await this.friendLinks.findBetween(viewerId, targetUserId);
    if (!link || link.status === FriendLinkStatus.DECLINED) {
      return { status: FriendshipStatus.NONE, requestId: null };
    }
    if (link.status === FriendLinkStatus.ACCEPTED) {
      return { status: FriendshipStatus.FRIENDS, requestId: link.id };
    }

    return link.fromUserId === viewerId
      ? { status: FriendshipStatus.REQUEST_SENT, requestId: link.id }
      : { status: FriendshipStatus.REQUEST_RECEIVED, requestId: link.id };
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { FriendLinkStatus } from '@prisma/client';

import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { FRIEND_LINK_REPOSITORY, FriendLinkRepository } from '../domain/friend-link.repository';
import { Friendship, FriendshipStatus } from '../domain/friendship-status';
import { toUserSummary, UserSummary } from './user-summary';

const MAX_RESULTS = 50;

export type UserSearchResult = UserSummary & { friendship: Friendship };

@Injectable()
export class SearchUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FRIEND_LINK_REPOSITORY) private readonly friendLinks: FriendLinkRepository,
  ) {}

  async execute(query: string, viewerId: string, limit = MAX_RESULTS): Promise<UserSearchResult[]> {
    const found = await this.users.search(query.trim(), Math.min(limit, MAX_RESULTS), viewerId);

    const links = await this.friendLinks.findBetweenMany(
      viewerId,
      found.map((user) => user.id),
    );
    const linkByUserId = new Map(
      links.map((link) => [link.fromUserId === viewerId ? link.toUserId : link.fromUserId, link]),
    );

    return found.map((user) => ({
      ...toUserSummary(user),
      friendship: this.toFriendship(viewerId, linkByUserId.get(user.id)),
    }));
  }

  private toFriendship(
    viewerId: string,
    link: { id: string; fromUserId: string; status: FriendLinkStatus } | undefined,
  ): Friendship {
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

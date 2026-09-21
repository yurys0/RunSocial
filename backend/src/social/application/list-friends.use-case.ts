import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY, UserRepository } from '../../identity/domain/user.repository';
import { Pagination } from '../../shared/pagination/pagination';
import { FriendLink } from '../domain/friend-link.entity';
import { FRIEND_LINK_REPOSITORY, FriendLinkRepository } from '../domain/friend-link.repository';
import { toUserSummary, UserSummary } from './user-summary';

export type FriendRequestView = {
  id: string;
  user: UserSummary;
  createdAt: Date;
};

@Injectable()
export class ListFriendsUseCase {
  constructor(
    @Inject(FRIEND_LINK_REPOSITORY) private readonly friendLinks: FriendLinkRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async friends(userId: string, pagination?: Pagination): Promise<UserSummary[]> {
    const ids = await this.friendLinks.findAcceptedFriendIds(userId, pagination);
    const users = await this.users.findManyByIds(ids);
    return users.map((user) => toUserSummary(user));
  }

  async incoming(userId: string): Promise<FriendRequestView[]> {
    const links = await this.friendLinks.findIncoming(userId);
    return this.withUsers(links, (link) => link.fromUserId);
  }

  async outgoing(userId: string): Promise<FriendRequestView[]> {
    const links = await this.friendLinks.findOutgoing(userId);
    return this.withUsers(links, (link) => link.toUserId);
  }

  /** Участники заявок подтягиваются одним запросом, а не по запросу на каждую. */
  private async withUsers(
    links: FriendLink[],
    pickUserId: (link: FriendLink) => string,
  ): Promise<FriendRequestView[]> {
    const users = await this.users.findManyByIds(links.map(pickUserId));
    const byId = new Map(users.map((user) => [user.id, user]));

    return links.flatMap((link) => {
      const user = byId.get(pickUserId(link));
      return user
        ? [{ id: link.id, user: toUserSummary(user), createdAt: link.createdAt }]
        : [];
    });
  }
}

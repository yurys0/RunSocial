import { Inject, Injectable } from '@nestjs/common';

import { FRIEND_LINK_REPOSITORY, FriendLinkRepository } from '../domain/friend-link.repository';

@Injectable()
export class GetFriendIdsUseCase {
  constructor(@Inject(FRIEND_LINK_REPOSITORY) private readonly friendLinks: FriendLinkRepository) {}

  execute(userId: string): Promise<string[]> {
    return this.friendLinks.findAcceptedFriendIds(userId);
  }
}

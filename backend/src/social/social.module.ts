import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { GetFriendIdsUseCase } from './application/get-friend-ids.use-case';
import { CanViewProfileUseCase } from './application/can-view-profile.use-case';
import { CancelFriendRequestUseCase } from './application/cancel-friend-request.use-case';
import { GetFriendshipUseCase } from './application/get-friendship.use-case';
import { ListFriendsUseCase } from './application/list-friends.use-case';
import { RemoveFriendUseCase } from './application/remove-friend.use-case';
import { RespondFriendRequestUseCase } from './application/respond-friend-request.use-case';
import { SearchUsersUseCase } from './application/search-users.use-case';
import { SendFriendRequestUseCase } from './application/send-friend-request.use-case';
import { FRIEND_LINK_REPOSITORY } from './domain/friend-link.repository';
import { PrismaFriendLinkRepository } from './infrastructure/prisma-friend-link.repository';
import { FriendEventsController } from './interface/friend-events.controller';
import { FriendsController } from './interface/friends.controller';
import { SocialResolver } from './interface/social.resolver';

@Module({
  imports: [IdentityModule],
  controllers: [FriendsController, FriendEventsController],
  providers: [
    { provide: FRIEND_LINK_REPOSITORY, useClass: PrismaFriendLinkRepository },
    GetFriendIdsUseCase,
    GetFriendshipUseCase,
    CanViewProfileUseCase,
    RemoveFriendUseCase,
    CancelFriendRequestUseCase,
    SearchUsersUseCase,
    ListFriendsUseCase,
    SendFriendRequestUseCase,
    RespondFriendRequestUseCase,
    SocialResolver,
  ],
  exports: [
    GetFriendIdsUseCase,
    GetFriendshipUseCase,
    CanViewProfileUseCase,
    FRIEND_LINK_REPOSITORY,
  ],
})
export class SocialModule {}

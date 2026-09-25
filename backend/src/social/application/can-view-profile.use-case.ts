import { Injectable } from '@nestjs/common';

import { FriendshipStatus } from '../domain/friendship-status';
import { GetFriendshipUseCase } from './get-friendship.use-case';

@Injectable()
export class CanViewProfileUseCase {
  constructor(private readonly getFriendship: GetFriendshipUseCase) {}

  async execute(viewerId: string, ownerId: string, ownerIsPrivate: boolean): Promise<boolean> {
    if (!ownerIsPrivate || viewerId === ownerId) {
      return true;
    }
    const friendship = await this.getFriendship.execute(viewerId, ownerId);
    return friendship.status === FriendshipStatus.FRIENDS;
  }
}

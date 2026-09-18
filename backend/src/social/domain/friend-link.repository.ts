import { FriendLink } from './friend-link.entity';

export const FRIEND_LINK_REPOSITORY = Symbol('FRIEND_LINK_REPOSITORY');

export interface FriendLinkRepository {
  findAcceptedFriendIds(userId: string): Promise<string[]>;
  areFriends(userId: string, otherUserId: string): Promise<boolean>;

  findById(id: string): Promise<FriendLink | null>;
  findBetween(userId: string, otherUserId: string): Promise<FriendLink | null>;
  findBetweenMany(userId: string, otherUserIds: string[]): Promise<FriendLink[]>;
  findIncoming(userId: string): Promise<FriendLink[]>;
  findOutgoing(userId: string): Promise<FriendLink[]>;

  create(fromUserId: string, toUserId: string): Promise<FriendLink>;
  save(link: FriendLink): Promise<FriendLink>;
  delete(id: string): Promise<void>;
}

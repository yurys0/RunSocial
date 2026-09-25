import { FriendLinkStatus } from '@prisma/client';

export class FriendLink {
  constructor(
    readonly id: string,
    readonly fromUserId: string,
    readonly toUserId: string,
    private _status: FriendLinkStatus,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  get status(): FriendLinkStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  accept(): void {
    this._status = FriendLinkStatus.ACCEPTED;
  }

  decline(): void {
    this._status = FriendLinkStatus.DECLINED;
  }

  renew(): void {
    this._status = FriendLinkStatus.PENDING;
  }

  isPendingFor(userId: string): boolean {
    return this._status === FriendLinkStatus.PENDING && this.toUserId === userId;
  }
}

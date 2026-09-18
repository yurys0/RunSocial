export enum FriendshipStatus {
  SELF = 'SELF',
  NONE = 'NONE',
  FRIENDS = 'FRIENDS',
  REQUEST_SENT = 'REQUEST_SENT',
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
}

export type Friendship = {
  status: FriendshipStatus;
  /** Заполнен только для REQUEST_RECEIVED: по нему принимают или отклоняют заявку */
  requestId: string | null;
};

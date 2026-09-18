export function friendEventsChannel(userId: string): string {
  return `friends:requests:${userId}`;
}

export type FriendEvent =
  | { type: 'request_received'; requestId: string; from: { id: string; login: string; displayName: string } }
  | { type: 'request_accepted'; requestId: string; by: { id: string; login: string; displayName: string } };

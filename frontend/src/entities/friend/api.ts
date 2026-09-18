import { gql, rest } from '../../shared/api/client';

export type UserSummary = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
};

export type FriendshipStatus =
  | 'SELF'
  | 'NONE'
  | 'FRIENDS'
  | 'REQUEST_SENT'
  | 'REQUEST_RECEIVED';

export type UserSearchResult = UserSummary & {
  friendship: { status: FriendshipStatus; requestId: string | null };
};

export type FriendRequest = {
  id: string;
  user: UserSummary;
  createdAt: string;
};

const SUMMARY = 'id login displayName avatarUrl';

/** Пустой запрос возвращает всех — на этом держится раздел «Люди». */
export async function searchUsers(query = ''): Promise<UserSearchResult[]> {
  const data = await gql<{ searchUsers: UserSearchResult[] }>(
    `query People($query: String!) {
      searchUsers(query: $query) { ${SUMMARY} friendship { status requestId } }
    }`,
    { query },
  );
  return data.searchUsers;
}

/** Списки друзей и заявок приходят одним запросом — ради этого и нужен GraphQL. */
export async function fetchFriendsPage(): Promise<{
  friends: UserSummary[];
  incomingFriendRequests: FriendRequest[];
  outgoingFriendRequests: FriendRequest[];
}> {
  return gql(`{
    friends { ${SUMMARY} }
    incomingFriendRequests { id createdAt user { ${SUMMARY} } }
    outgoingFriendRequests { id createdAt user { ${SUMMARY} } }
  }`);
}

export function sendFriendRequest(login: string) {
  return rest('/friends/requests', { method: 'POST', body: { login } });
}

export function acceptFriendRequest(id: string) {
  return rest(`/friends/requests/${id}/accept`, { method: 'POST' });
}

export function declineFriendRequest(id: string) {
  return rest(`/friends/requests/${id}/decline`, { method: 'POST' });
}

export function cancelFriendRequest(id: string) {
  return rest<void>(`/friends/requests/${id}`, { method: 'DELETE' });
}

/** В пути id пользователя, а не заявки */
export function removeFriend(userId: string) {
  return rest<void>(`/friends/${userId}`, { method: 'DELETE' });
}

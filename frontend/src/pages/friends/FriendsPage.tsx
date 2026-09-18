import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  fetchFriendsPage,
  UserSummary,
} from '../../entities/friend/api';
import { useSse } from '../../shared/api/use-sse';
import { useQuery } from '../../shared/hooks/use-query';
import { Avatar, Button, Card, ErrorMessage, Spinner } from '../../shared/ui';

type FriendEvent =
  | { type: 'request_received'; requestId: string; from: UserSummary }
  | { type: 'request_accepted'; requestId: string; by: UserSummary };

type Tab = 'friends' | 'requests';

export function FriendsPage() {
  const { data, loading, error, reload } = useQuery(fetchFriendsPage, []);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('friends');

  // Второй SSE-канал: уведомления о заявках приходят без перезагрузки страницы
  useSse<FriendEvent>('/friends/events', (event) => {
    setNotice(
      event.type === 'request_received'
        ? `${event.from.displayName} хочет добавить вас в друзья`
        : `${event.by.displayName} принял вашу заявку`,
    );
    reload();
  });

  const incoming = data?.incomingFriendRequests ?? [];
  const outgoing = data?.outgoingFriendRequests ?? [];
  const friends = data?.friends ?? [];

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'friends', label: `Мои друзья${friends.length ? ` · ${friends.length}` : ''}` },
    { key: 'requests', label: `Заявки${incoming.length ? ` · ${incoming.length}` : ''}` },
  ];

  return (
    <div className="container">
      <h1>Друзья</h1>

      {notice && (
        <Card>
          <div className="row">
            <strong>{notice}</strong>
            <Button size="sm" variant="secondary" className="spacer" onClick={() => setNotice(null)}>
              Понятно
            </Button>
          </div>
        </Card>
      )}

      <div className="tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`btn btn-sm ${tab === item.key ? '' : 'btn-secondary'}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading && <Spinner />}

      {data && tab === 'friends' && (
        <Card>
          {friends.length === 0 ? (
            <p className="muted">
              Пока никого. Знакомые ищутся в разделе <Link to="/people">«Люди»</Link>.
            </p>
          ) : (
            friends.map((friend) => (
              <div className="row" key={friend.id} style={{ padding: '6px 0' }}>
                <Avatar url={friend.avatarUrl} name={friend.displayName} />
                <Link to={`/u/${friend.login}`}>{friend.displayName}</Link>
                <span className="muted">@{friend.login}</span>
              </div>
            ))
          )}
        </Card>
      )}

      {data && tab === 'requests' && (
        <>
          <Card>
            <h3>Входящие</h3>
            {incoming.length === 0 ? (
              <p className="muted">Новых заявок нет.</p>
            ) : (
              incoming.map((request) => (
                <RequestRow key={request.id} request={request} onDone={reload} />
              ))
            )}
          </Card>

          <Card>
            <h3>Исходящие</h3>
            {outgoing.length === 0 ? (
              <p className="muted">Вы никому не отправляли заявок.</p>
            ) : (
              outgoing.map((request) => (
                <div className="row" key={request.id} style={{ padding: '6px 0' }}>
                  <Avatar url={request.user.avatarUrl} name={request.user.displayName} />
                  <Link to={`/u/${request.user.login}`}>{request.user.displayName}</Link>
                  <span className="muted spacer">ожидает ответа</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => cancelFriendRequest(request.id).then(reload)}
                  >
                    Отменить
                  </Button>
                </div>
              ))
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function RequestRow({
  request,
  onDone,
}: {
  request: { id: string; user: UserSummary };
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respond = async (action: (id: string) => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action(request.id);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: '6px 0' }}>
      <div className="row">
        <Avatar url={request.user.avatarUrl} name={request.user.displayName} />
        <Link to={`/u/${request.user.login}`}>{request.user.displayName}</Link>
        <span className="spacer" />
        <Button size="sm" disabled={busy} onClick={() => respond(acceptFriendRequest)}>
          Принять
        </Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => respond(declineFriendRequest)}>
          Отклонить
        </Button>
      </div>
      {error && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

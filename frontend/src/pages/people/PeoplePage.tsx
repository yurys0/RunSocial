import { FormEvent, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  searchUsers,
  sendFriendRequest,
  UserSearchResult,
} from '../../entities/friend/api';
import { useQuery } from '../../shared/hooks/use-query';
import { Avatar, Button, Card, ErrorMessage, Field, Spinner } from '../../shared/ui';

export function PeoplePage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => searchUsers(submitted), [submitted]);
  const { data, loading, error, reload } = useQuery(load, [submitted]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(query.trim());
  };

  const act = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  return (
    <div className="container">
      <h1>Люди</h1>

      <Card>
        <form onSubmit={search} className="search-row">
          <Field
            label="Логин или имя"
            name="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" disabled={loading}>
            Найти
          </Button>
          {submitted && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQuery('');
                setSubmitted('');
              }}
            >
              Показать всех
            </Button>
          )}
        </form>
      </Card>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {actionError && <ErrorMessage>{actionError}</ErrorMessage>}
      {loading && <Spinner />}

      {data && (
        <Card>
          {data.length === 0 ? (
            <p className="muted">
              {submitted ? 'Никого не нашли.' : 'Кроме вас здесь пока никого нет.'}
            </p>
          ) : (
            data.map((user) => (
              <div className="row" key={user.id} style={{ padding: '6px 0' }}>
                <Avatar url={user.avatarUrl} name={user.displayName} />
                <Link to={`/u/${user.login}`}>{user.displayName}</Link>
                <span className="muted">@{user.login}</span>
                <span className="spacer" />
                <PersonRowAction user={user} onAct={act} />
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

function PersonRowAction({
  user,
  onAct,
}: {
  user: UserSearchResult;
  onAct: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const requestId = user.friendship.requestId ?? '';

  switch (user.friendship.status) {
    case 'FRIENDS':
      return <span className="muted">у вас в друзьях</span>;
    case 'REQUEST_SENT':
      return (
        <Button size="sm" variant="secondary" onClick={() => onAct(() => cancelFriendRequest(requestId))}>
          Отменить заявку
        </Button>
      );
    case 'REQUEST_RECEIVED':
      return (
        <>
          <Button size="sm" onClick={() => onAct(() => acceptFriendRequest(requestId))}>
            Принять
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onAct(() => declineFriendRequest(requestId))}>
            Отклонить
          </Button>
        </>
      );
    default:
      return (
        <Button size="sm" onClick={() => onAct(() => sendFriendRequest(user.login))}>
          Добавить
        </Button>
      );
  }
}

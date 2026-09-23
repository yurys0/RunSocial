import { FormEvent, useCallback, useState } from 'react';

import { AdminUser, fetchUsers } from '../../entities/admin/api';
import { useQuery } from '../../shared/hooks/use-query';
import { Avatar, Button, Card, ErrorMessage, Field, formatDate, Spinner } from '../../shared/ui';
import { UserCard } from './UserCard';

export function AdminPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(() => fetchUsers(submitted), [submitted]);
  const { data, loading, error, reload } = useQuery(load, [submitted]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(query.trim());
  };

  return (
    <div className="container">
      <h1>Администрирование</h1>

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
      {loading && <Spinner />}

      {data && (
        <Card>
          {data.length === 0 ? (
            <p className="muted">Никого не нашли.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Роль</th>
                  <th>Пробежки</th>
                  <th>Трекеры</th>
                  <th>Регистрация</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    selected={user.id === selected}
                    onSelect={() => setSelected(user.id === selected ? null : user.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {selected && (
        <UserCard
          userId={selected}
          onChanged={reload}
          onDeleted={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  selected,
  onSelect,
}: {
  user: AdminUser;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr className={selected ? 'admin-row-selected' : undefined} onClick={onSelect}>
      <td>
        <div className="row">
          <Avatar url={user.avatarUrl} name={user.displayName} />
          <div>
            <div>{user.displayName}</div>
            <span className="muted">@{user.login}</span>
          </div>
        </div>
      </td>
      <td>{user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</td>
      <td>{user.activityCount}</td>
      <td>{user.trackerCount}</td>
      <td className="muted">{formatDate(user.createdAt)}</td>
    </tr>
  );
}

import { FormEvent, useCallback, useState } from 'react';

import {
  AdminUserDetails,
  deleteActivity,
  deleteUser,
  deleteUserAvatar,
  disconnectTracker,
  fetchUser,
  syncTracker,
  updateUser,
} from '../../entities/admin/api';
import { useAuth } from '../../app/auth-context';
import { useQuery } from '../../shared/hooks/use-query';
import {
  Avatar,
  Button,
  Card,
  ErrorMessage,
  Field,
  formatDate,
  formatDuration,
  formatKm,
  formatPace,
  Spinner,
} from '../../shared/ui';

type Props = {
  userId: string;
  onChanged: () => void;
  onDeleted: () => void;
};

export function UserCard({ userId, onChanged, onDeleted }: Props) {
  const load = useCallback(() => fetchUser(userId), [userId]);
  const { data, loading, error, reload } = useQuery(load, [userId]);
  const [actionError, setActionError] = useState<string | null>(null);

  const act = async (action: () => Promise<unknown>, afterDelete = false) => {
    setActionError(null);
    try {
      await action();
      onChanged();
      if (afterDelete) {
        onDeleted();
      } else {
        reload();
      }
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  if (loading) {
    return <Spinner />;
  }
  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }
  if (!data) {
    return null;
  }

  return (
    <Card>
      {actionError && <ErrorMessage>{actionError}</ErrorMessage>}

      <div className="row">
        <Avatar url={data.avatarUrl} name={data.displayName} large />
        <div>
          <h2 style={{ margin: 0 }}>{data.displayName}</h2>
          <span className="muted">
            @{data.login} · {data.isPrivate ? 'закрытый профиль' : 'открытый профиль'} · с{' '}
            {formatDate(data.createdAt)}
          </span>
        </div>
      </div>

      <UserForm user={data} onSubmit={(patch) => act(() => updateUser(data.id, patch))} />

      <AdminActions user={data} onAct={act} />

      <h3>Трекеры</h3>
      {data.trackerAccounts.length === 0 ? (
        <p className="muted">Ничего не привязано.</p>
      ) : (
        data.trackerAccounts.map((tracker) => (
          <div className="row admin-item" key={tracker.id}>
            <span>{tracker.provider}</span>
            <span className="muted">
              {tracker.status}
              {tracker.lastSyncAt ? ` · синк ${formatDate(tracker.lastSyncAt)}` : ' · синка не было'}
            </span>
            <span className="spacer" />
            <Button size="sm" variant="secondary" onClick={() => act(() => syncTracker(tracker.id))}>
              Синхронизировать
            </Button>
            <Button size="sm" variant="secondary" onClick={() => act(() => disconnectTracker(tracker.id))}>
              Отвязать
            </Button>
          </div>
        ))
      )}

      <h3>Последние пробежки</h3>
      {data.activities.length === 0 ? (
        <p className="muted">Пробежек нет.</p>
      ) : (
        data.activities.map((activity) => (
          <div className="row admin-item" key={activity.id}>
            <span>{formatKm(activity.distanceMeters)}</span>
            <span className="muted">
              {formatDuration(activity.durationSeconds)} · {formatPace(activity.avgPaceSecPerKm)} ·{' '}
              {formatDate(activity.startedAt)}
            </span>
            <span className="spacer" />
            <Button size="sm" variant="secondary" onClick={() => act(() => deleteActivity(activity.id))}>
              Удалить
            </Button>
          </div>
        ))
      )}
    </Card>
  );
}

function UserForm({
  user,
  onSubmit,
}: {
  user: AdminUserDetails;
  onSubmit: (patch: { login: string; displayName: string }) => void;
}) {
  const [form, setForm] = useState({ login: user.login, displayName: user.displayName });
  const unchanged = form.login === user.login && form.displayName === user.displayName;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="search-row">
      <Field
        label="Логин"
        name="login"
        value={form.login}
        onChange={(event) => setForm({ ...form, login: event.target.value })}
      />
      <Field
        label="Имя"
        name="displayName"
        value={form.displayName}
        onChange={(event) => setForm({ ...form, displayName: event.target.value })}
      />
      <Button type="submit" disabled={unchanged}>
        Сохранить
      </Button>
    </form>
  );
}

function AdminActions({
  user,
  onAct,
}: {
  user: AdminUserDetails;
  onAct: (action: () => Promise<unknown>, afterDelete?: boolean) => Promise<void>;
}) {
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.id === user.id;

  return (
    <div className="row admin-item">
      <Button
        size="sm"
        variant="secondary"
        disabled={isSelf}
        onClick={() => onAct(() => updateUser(user.id, { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' }))}
      >
        {user.role === 'ADMIN' ? 'Снять права администратора' : 'Сделать администратором'}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={!user.avatarUrl}
        onClick={() => onAct(() => deleteUserAvatar(user.id))}
      >
        Удалить аватарку
      </Button>
      <span className="spacer" />
      <Button
        size="sm"
        variant="secondary"
        disabled={isSelf}
        onClick={() => onAct(() => deleteUser(user.id), true)}
      >
        Удалить пользователя
      </Button>
    </div>
  );
}

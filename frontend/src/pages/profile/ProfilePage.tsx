import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../app/auth-context';
import { ActivityCard } from '../../entities/activity/ActivityCard';
import { FriendshipStatus, fetchMyProfile, fetchProfile } from '../../entities/user/api';
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '../../entities/friend/api';
import { useQuery } from '../../shared/hooks/use-query';
import {
  Button,
  Card,
  ErrorMessage,
  Spinner,
  formatDuration,
  formatKm,
  pluralWord,
} from '../../shared/ui';
import { PrivacySection } from './PrivacySection';
import { ProfileHeader } from './ProfileHeader';
import { TrackerSection } from './TrackerSection';

export function ProfilePage() {
  const { login } = useParams<{ login: string }>();
  const { user } = useAuth();
  const isOwn = user?.login === login;

  const { data, loading, error, reload } = useQuery(
    () => (isOwn ? fetchMyProfile() : fetchProfile(login!)),
    [login, isOwn],
  );

  if (loading) return <div className="container"><Spinner /></div>;
  if (error) return <div className="container"><ErrorMessage>{error}</ErrorMessage></div>;
  if (!data) return null;

  return (
    <div className="container">
      <ProfileHeader
        displayName={data.displayName}
        login={data.login}
        avatarUrl={data.avatarUrl}
        isOwn={isOwn}
        onChanged={reload}
      >
        {!isOwn && (
          <FriendshipActions
            login={data.login}
            userId={data.id}
            friendship={data.friendship}
            onChanged={reload}
          />
        )}
      </ProfileHeader>

      <Card>
        {!data.isVisible ? (
          <p className="muted">Профиль закрыт. Пробежки и статистику видят только друзья.</p>
        ) : (
          <div className="stat-grid">
            <div>
              <div className="stat-value">{data.stats.activityCount}</div>
              <div className="stat-label">
                {pluralWord(data.stats.activityCount, 'пробежка', 'пробежки', 'пробежек')}
              </div>
            </div>
            <div>
              <div className="stat-value">{formatKm(data.stats.totalDistanceMeters)}</div>
              <div className="stat-label">всего</div>
            </div>
            <div>
              <div className="stat-value">{formatDuration(data.stats.totalDurationSeconds)}</div>
              <div className="stat-label">в движении</div>
            </div>
          </div>
        )}
      </Card>

      {isOwn && (
        <>
          <PrivacySection isPrivate={data.isPrivate} onChanged={reload} />
          <TrackerSection onImported={reload} />
        </>
      )}

      {data.isVisible && (
        <>
          <h3>Пробежки</h3>
          {data.activities.length === 0 && (
            <Card>
              <p className="muted">Пробежек пока нет.</p>
            </Card>
          )}
          {data.activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              showAuthor={false}
              canLike={!isOwn}
            />
          ))}
        </>
      )}
    </div>
  );
}

function FriendshipActions({
  login,
  userId,
  friendship,
  onChanged,
}: {
  login: string;
  userId: string;
  friendship: { status: FriendshipStatus; requestId: string | null };
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const requestId = friendship.requestId ?? '';

  return (
    <div className="spacer">
      <div className="row">
        {friendship.status === 'NONE' && (
          <Button disabled={busy} onClick={() => run(() => sendFriendRequest(login))}>
            Добавить в друзья
          </Button>
        )}

        {friendship.status === 'REQUEST_SENT' && (
          <span className="muted">Заявка отправлена</span>
        )}

        {friendship.status === 'REQUEST_RECEIVED' && (
          <>
            <span className="muted">Хочет добавить вас</span>
            <Button disabled={busy} onClick={() => run(() => acceptFriendRequest(requestId))}>
              Принять
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => run(() => declineFriendRequest(requestId))}
            >
              Отклонить
            </Button>
          </>
        )}

        {friendship.status === 'FRIENDS' && (
          <>
            <span className="muted">У вас в друзьях</span>
            <Button variant="secondary" disabled={busy} onClick={() => run(() => removeFriend(userId))}>
              Удалить из друзей
            </Button>
          </>
        )}
      </div>
      {error && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

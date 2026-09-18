import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Avatar, Card, formatDate, formatDuration, formatKm, formatPace } from '../../shared/ui';
import { likeActivity, unlikeActivity } from './api';
import { Activity } from './types';

/** Лайк обновляем оптимистично, но счётчик берём из ответа — он точен при параллельных лайках. */
export function ActivityCard({
  activity,
  showAuthor = true,
  canLike,
}: {
  activity: Activity;
  showAuthor?: boolean;
  canLike: boolean;
}) {
  const [liked, setLiked] = useState(activity.likedByMe);
  const [likeCount, setLikeCount] = useState(activity.likeCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = liked ? await unlikeActivity(activity.id) : await likeActivity(activity.id);
      setLiked(!liked);
      setLikeCount(result.likeCount);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="row" style={{ marginBottom: 8 }}>
        {showAuthor && activity.author && (
          <>
            <Avatar url={activity.author.avatarUrl} name={activity.author.displayName} />
            <Link to={`/u/${activity.author.login}`}>
              <strong>{activity.author.displayName}</strong>
            </Link>
          </>
        )}
        <span className="muted">{formatDate(activity.startedAt)}</span>
      </div>

      <div className="stat-grid" style={{ marginBottom: 12 }}>
        <div>
          <div className="stat-value">{formatKm(activity.distanceMeters)}</div>
          <div className="stat-label">дистанция</div>
        </div>
        <div>
          <div className="stat-value">{formatDuration(activity.durationSeconds)}</div>
          <div className="stat-label">время</div>
        </div>
        <div>
          <div className="stat-value">{formatPace(activity.avgPaceSecPerKm)}</div>
          <div className="stat-label">темп</div>
        </div>
      </div>

      {error && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="row">
        <button
          className={`btn btn-sm ${liked ? '' : 'btn-secondary'}`}
          onClick={toggleLike}
          disabled={busy || !canLike}
          title={canLike ? '' : 'Нельзя лайкнуть свою пробежку'}
        >
          ♥ {likeCount}
        </button>
        <Link to={`/activities/${activity.id}`} className="spacer">
          Маршрут на карте →
        </Link>
      </div>
    </Card>
  );
}

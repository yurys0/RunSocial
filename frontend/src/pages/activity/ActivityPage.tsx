import { useParams } from 'react-router-dom';

import { fetchActivity } from '../../entities/activity/api';
import { useQuery } from '../../shared/hooks/use-query';
import {
  Card,
  ErrorMessage,
  Spinner,
  formatDate,
  formatDuration,
  formatKm,
  formatPace,
  formatTimeRange,
} from '../../shared/ui';
import { RouteMap } from './RouteMap';

export function ActivityPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(() => fetchActivity(id!), [id]);

  if (loading) return <div className="container"><Spinner /></div>;
  if (error) return <div className="container"><ErrorMessage>{error}</ErrorMessage></div>;
  if (!data) return null;

  const points = data.routePoints ?? [];

  return (
    <div className="container">
      <h1>Пробежка</h1>
      <p className="muted">
        {formatDate(data.startedAt)}, {formatTimeRange(data.startedAt, data.endedAt)}
      </p>

      <Card>
        <div className="stat-grid">
          <div>
            <div className="stat-value">{formatKm(data.distanceMeters)}</div>
            <div className="stat-label">дистанция</div>
          </div>
          <div>
            <div className="stat-value">{formatDuration(data.durationSeconds)}</div>
            <div className="stat-label">время</div>
          </div>
          <div>
            <div className="stat-value">{formatPace(data.avgPaceSecPerKm)}</div>
            <div className="stat-label">средний темп</div>
          </div>
          <div>
            <div className="stat-value">{data.likeCount}</div>
            <div className="stat-label">лайков</div>
          </div>
        </div>
      </Card>

      <Card>
        <h3>Маршрут</h3>
        {points.length > 0 ? (
          <RouteMap points={points} />
        ) : (
          <p className="muted">Трекер не передал маршрут для этой пробежки.</p>
        )}
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';

import { rest } from '../../shared/api/client';
import { useQuery } from '../../shared/hooks/use-query';
import { Avatar, Card, ErrorMessage, Spinner, formatKm, plural } from '../../shared/ui';

type TopRunner = {
  userId: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  totalDistanceMeters: number;
  activityCount: number;
};

type LandingStats = {
  period: string;
  totalUsers: number;
  totalActivities: number;
  totalDistanceMeters: number;
  topByDistance: TopRunner[];
  topByActivityCount: TopRunner[];
};

const PERIODS = [
  { value: 'WEEK', label: 'Неделя' },
  { value: 'MONTH', label: 'Месяц' },
  { value: 'ALL', label: 'Всё время' },
];

export function LandingPage() {
  const [period, setPeriod] = useState('MONTH');
  const { data, loading, error } = useQuery<LandingStats>(
    () => rest(`/stats?period=${period}`),
    [period],
  );

  return (
    <div className="container">
      <h1>Соцсеть для бегунов</h1>
      <p className="muted">
        Привяжите трекер, импортируйте пробежки и следите за результатами друзей.
      </p>

      <div className="tabs">
        {PERIODS.map((item) => (
          <button
            key={item.value}
            className={`btn btn-sm ${period === item.value ? '' : 'btn-secondary'}`}
            onClick={() => setPeriod(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading && <Spinner />}

      {data && (
        <>
          <Card>
            <div className="stat-grid">
              <div>
                <div className="stat-value">{data.totalUsers}</div>
                <div className="stat-label">бегунов</div>
              </div>
              <div>
                <div className="stat-value">{data.totalActivities}</div>
                <div className="stat-label">пробежек</div>
              </div>
              <div>
                <div className="stat-value">{Math.round(data.totalDistanceMeters / 1000)}</div>
                <div className="stat-label">километров</div>
              </div>
            </div>
          </Card>

          <TopList title="Больше всех пробежали" runners={data.topByDistance} metric="distance" />
          <TopList
            title="Больше всех пробежек"
            runners={data.topByActivityCount}
            metric="count"
          />
        </>
      )}
    </div>
  );
}

function TopList({
  title,
  runners,
  metric,
}: {
  title: string;
  runners: TopRunner[];
  metric: 'distance' | 'count';
}) {
  return (
    <Card>
      <h3>{title}</h3>
      {runners.length === 0 && <p className="muted">Пока нет данных за этот период</p>}
      {runners.map((runner, index) => (
        <div className="row" key={runner.userId} style={{ padding: '8px 0' }}>
          <span className="muted" style={{ width: 20 }}>
            {index + 1}
          </span>
          <Avatar url={runner.avatarUrl} name={runner.displayName} />
          <Link to={`/u/${runner.login}`}>{runner.displayName}</Link>
          <span className="spacer" />
          <strong>
            {metric === 'distance'
              ? formatKm(runner.totalDistanceMeters)
              : plural(runner.activityCount, 'пробежка', 'пробежки', 'пробежек')}
          </strong>
        </div>
      ))}
    </Card>
  );
}

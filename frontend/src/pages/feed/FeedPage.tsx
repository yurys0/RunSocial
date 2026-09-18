import { useState } from 'react';

import { useAuth } from '../../app/auth-context';
import { ActivityCard } from '../../entities/activity/ActivityCard';
import { fetchFeed } from '../../entities/activity/api';
import { useQuery } from '../../shared/hooks/use-query';
import { Button, Card, ErrorMessage, Spinner } from '../../shared/ui';

const PAGE_SIZE = 10;

export function FeedPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const { data, loading, error } = useQuery(() => fetchFeed(PAGE_SIZE, page * PAGE_SIZE), [page]);

  return (
    <div className="container">
      <h1>Лента</h1>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading && <Spinner />}

      {data && data.length === 0 && (
        <Card>
          <p className="muted">
            {page === 0
              ? 'Пока пусто. Привяжите трекер в профиле или добавьте друзей.'
              : 'Больше пробежек нет.'}
          </p>
        </Card>
      )}

      {data?.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          canLike={activity.userId !== user?.id}
        />
      ))}

      <div className="row">
        <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
          Назад
        </Button>
        <Button
          variant="secondary"
          disabled={!data || data.length < PAGE_SIZE}
          onClick={() => setPage(page + 1)}
        >
          Дальше
        </Button>
      </div>
    </div>
  );
}

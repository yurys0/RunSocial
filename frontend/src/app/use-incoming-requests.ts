import { useCallback, useEffect, useState } from 'react';

import { gql } from '../shared/api/client';
import { useSse } from '../shared/api/use-sse';

/** Счётчик для значка в шапке; обновляется по тому же SSE-каналу, что и страница друзей. */
export function useIncomingRequestsCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  const reload = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }
    try {
      const data = await gql<{ incomingFriendRequests: Array<{ id: string }> }>(
        '{ incomingFriendRequests { id } }',
      );
      setCount(data.incomingFriendRequests.length);
    } catch {
      // Значок вспомогательный — ошибка здесь не должна ничего ломать
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useSse('/friends/events', () => void reload(), enabled);

  return count;
}

import { useCallback, useEffect, useState } from 'react';

import { gql } from '../shared/api/client';
import { useSse } from '../shared/api/use-sse';

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
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useSse('/friends/events', () => void reload(), enabled);

  return count;
}

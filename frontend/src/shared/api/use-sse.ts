import { useEffect, useRef, useState } from 'react';

import { sseUrl } from './client';

/** JWT уходит в query: EventSource не умеет слать заголовки. */
export function useSse<T>(path: string, onEvent: (event: T) => void, enabled = true) {
  const [connected, setConnected] = useState(false);
  // Колбэк держим в ref, чтобы его обновление не пересоздавало соединение
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const source = new EventSource(sseUrl(path));

    source.onopen = () => setConnected(true);
    source.onmessage = (message) => {
      try {
        handlerRef.current(JSON.parse(message.data) as T);
      } catch {
      }
    };
    source.onerror = () => setConnected(false);

    return () => source.close();
  }, [path, enabled]);

  return connected;
}

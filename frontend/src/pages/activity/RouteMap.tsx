import { useEffect, useRef, useState } from 'react';

import { RoutePoint } from '../../entities/activity/types';

const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '';
const SCRIPT_ID = 'yandex-maps-script';

declare global {
  interface Window {
    ymaps?: {
      ready: (callback: () => void) => void;
      Map: new (element: HTMLElement, options: unknown) => {
        geoObjects: { add: (object: unknown) => void };
        setBounds: (bounds: number[][], options?: unknown) => void;
        destroy: () => void;
      };
      Polyline: new (geometry: number[][], properties: unknown, options: unknown) => unknown;
      Placemark: new (position: number[], properties: unknown, options: unknown) => unknown;
    };
  }
}

function loadYandexMaps(): Promise<void> {
  if (window.ymaps) {
    return Promise.resolve();
  }
  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Не удалось загрузить Яндекс.Карты')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить Яндекс.Карты'));
    document.head.appendChild(script);
  });
}

export function RouteMap({ points }: { points: RoutePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_KEY) {
      setError('Карта недоступна: не задан VITE_YANDEX_MAPS_API_KEY');
      return;
    }
    if (points.length === 0) {
      return;
    }

    let map: { destroy: () => void } | null = null;
    let cancelled = false;

    loadYandexMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.ymaps) return;

        window.ymaps.ready(() => {
          if (cancelled || !containerRef.current || !window.ymaps) return;

          const coordinates = points.map((point) => [point.lat, point.lng]);
          const instance = new window.ymaps.Map(containerRef.current, {
            center: coordinates[0],
            zoom: 13,
            controls: ['zoomControl'],
          });
          map = instance;

          instance.geoObjects.add(
            new window.ymaps.Polyline(coordinates, {}, { strokeColor: '#ff5a1f', strokeWidth: 4 }),
          );
          instance.geoObjects.add(
            new window.ymaps.Placemark(
              coordinates[0],
              { iconContent: 'Старт' },
              { preset: 'islands#greenStretchyIcon' },
            ),
          );
          instance.geoObjects.add(
            new window.ymaps.Placemark(
              coordinates[coordinates.length - 1],
              { iconContent: 'Финиш' },
              { preset: 'islands#redStretchyIcon', zIndex: 700 },
            ),
          );

          const lats = coordinates.map((c) => c[0]);
          const lngs = coordinates.map((c) => c[1]);
          instance.setBounds(
            [
              [Math.min(...lats), Math.min(...lngs)],
              [Math.max(...lats), Math.max(...lngs)],
            ],
            { checkZoomRange: true, zoomMargin: 20 },
          );
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      map?.destroy();
    };
  }, [points]);

  if (error) {
    return (
      <div
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
          padding: 16,
        }}
        className="muted"
      >
        {error}
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: 300, borderRadius: 'var(--radius)' }} />;
}

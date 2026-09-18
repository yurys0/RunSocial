import { FormEvent, useState } from 'react';

import {
  connectTracker,
  disconnectTracker,
  fetchTrackers,
  PROVIDER_LABELS,
  startSync,
  TrackerAccount,
} from '../../entities/tracker/api';
import { useSse } from '../../shared/api/use-sse';
import { useQuery } from '../../shared/hooks/use-query';
import { Button, Card, ErrorMessage, Field, Spinner } from '../../shared/ui';

type SyncEvent = {
  trackerAccountId: string;
  provider: string;
} & (
  | { stage: 'started' }
  | { stage: 'progress'; done: number; total: number }
  | { stage: 'done'; imported: number; updated: number }
  | { stage: 'error'; message: string }
);

export function TrackerSection({ onImported }: { onImported: () => void }) {
  const { data: trackers, loading, error, reload } = useQuery(fetchTrackers, []);
  const [sync, setSync] = useState<SyncEvent | null>(null);
  /** Запуск лишь ставит задачу в очередь, поэтому кнопку держим заблокированной до done или error. */
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Прогресс приходит из процесса воркера через Redis pub/sub
  useSse<SyncEvent>('/trackers/sync/events', (event) => {
    setSync(event);
    if (event.stage === 'done' || event.stage === 'error') {
      setSyncingId(null);
    }
    if (event.stage === 'done') {
      reload();
      onImported();
    }
  });

  return (
    <Card>
      <h3>Трекеры</h3>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading && <Spinner />}

      {trackers?.length === 0 && <p className="muted">Ни один трекер не привязан.</p>}

      {trackers?.map((tracker) => (
        <TrackerRow
          key={tracker.id}
          tracker={tracker}
          onChanged={reload}
          syncing={syncingId === tracker.id}
          onSyncStarted={() => {
            setSync(null);
            setSyncingId(tracker.id);
          }}
          onSyncFailed={() => setSyncingId(null)}
        />
      ))}

      {sync && <SyncStatus event={sync} />}

      <ConnectTracker
        connectedProviders={trackers?.map((t) => t.provider) ?? []}
        onConnected={reload}
      />
    </Card>
  );
}

function TrackerRow({
  tracker,
  onChanged,
  syncing,
  onSyncStarted,
  onSyncFailed,
}: {
  tracker: TrackerAccount;
  onChanged: () => void;
  syncing: boolean;
  onSyncStarted: () => void;
  onSyncFailed: () => void;
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

  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
      <div className="row">
        <strong>{PROVIDER_LABELS[tracker.provider]}</strong>
        <span className="muted">
          {tracker.status === 'ERROR' ? 'ошибка последней синхронизации' : 'подключён'}
        </span>
        <span className="spacer" />
        <Button
          size="sm"
          disabled={busy || syncing}
          onClick={() =>
            run(async () => {
              onSyncStarted();
              try {
                await startSync(tracker.id);
              } catch (err) {
                // Задача не встала в очередь — события не будет, снимаем блокировку сами
                onSyncFailed();
                throw err;
              }
            })
          }
        >
          {syncing ? 'Синхронизируется…' : 'Синхронизировать'}
        </Button>
        <Button size="sm" variant="secondary" disabled={busy}
          onClick={() => run(() => disconnectTracker(tracker.id))}>
          Отвязать
        </Button>
      </div>
      <div className="muted">
        {tracker.lastSyncAt
          ? `последняя синхронизация: ${new Date(tracker.lastSyncAt).toLocaleString('ru-RU')}`
          : 'ещё не синхронизировался'}
      </div>
      {error && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

function SyncStatus({ event }: { event: SyncEvent }) {
  if (event.stage === 'started') {
    return <p className="muted">Синхронизация началась…</p>;
  }
  if (event.stage === 'progress') {
    const percent = event.total > 0 ? Math.round((event.done / event.total) * 100) : 0;
    return (
      <p className="muted">
        Загружено {event.done} из {event.total} ({percent}%)
      </p>
    );
  }
  if (event.stage === 'done') {
    return (
      <p className="muted">
        Готово: новых {event.imported}, обновлено {event.updated}
      </p>
    );
  }
  return <ErrorMessage>{event.message}</ErrorMessage>;
}

function ConnectTracker({
  connectedProviders,
  onConnected,
}: {
  connectedProviders: string[];
  onConnected: () => void;
}) {
  const [open, setOpen] = useState(false);
  const available = (Object.keys(PROVIDER_LABELS) as Array<keyof typeof PROVIDER_LABELS>).filter(
    (provider) => !connectedProviders.includes(provider),
  );

  if (available.length === 0) {
    return <p className="muted">Все доступные трекеры уже привязаны.</p>;
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        + Привязать трекер
      </Button>
    );
  }

  return (
    <ConnectForm
      connectedProviders={connectedProviders}
      onConnected={() => {
        setOpen(false);
        onConnected();
      }}
      onCancel={() => setOpen(false)}
    />
  );
}

function ConnectForm({
  connectedProviders,
  onConnected,
  onCancel,
}: {
  connectedProviders: string[];
  onConnected: () => void;
  onCancel: () => void;
}) {
  const available = (Object.keys(PROVIDER_LABELS) as Array<keyof typeof PROVIDER_LABELS>).filter(
    (provider) => !connectedProviders.includes(provider),
  );
  const [form, setForm] = useState({ provider: '', login: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (available.length === 0) {
    return <p className="muted">Все доступные трекеры уже привязаны.</p>;
  }

  // Список провайдеров приходит асинхронно, поэтому выбранное значение берём из него:
  // иначе форма могла отправить уже привязанного провайдера
  const selectedProvider = available.includes(form.provider as keyof typeof PROVIDER_LABELS)
    ? (form.provider as keyof typeof PROVIDER_LABELS)
    : available[0];

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await connectTracker(selectedProvider, form.login, form.password);
      setForm({ ...form, login: '', password: '' });
      onConnected();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="field">
        <label htmlFor="provider">Сервис</label>
        <select
          id="provider"
          className="input"
          value={selectedProvider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
        >
          {available.map((provider) => (
            <option key={provider} value={provider}>
              {PROVIDER_LABELS[provider]}
            </option>
          ))}
        </select>
      </div>
      <Field
        label="Логин в сервисе"
        name="trackerLogin"
        value={form.login}
        onChange={(e) => setForm({ ...form, login: e.target.value })}
        required
      />
      <Field
        label="Пароль"
        name="trackerPassword"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <div className="row">
        <Button type="submit" disabled={busy}>
          {busy ? 'Проверяем данные…' : 'Привязать'}
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
          Отмена
        </Button>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        Пароль шифруется и используется только для загрузки ваших пробежек.
      </p>
    </form>
  );
}

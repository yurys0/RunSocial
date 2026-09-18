import { useState } from 'react';

import { updatePrivacy } from '../../entities/user/api';
import { Button, Card, ErrorMessage } from '../../shared/ui';

export function PrivacySection({
  isPrivate,
  onChanged,
}: {
  isPrivate: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      await updatePrivacy(!isPrivate);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h3>Приватность</h3>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="row">
        <div>
          <div>{isPrivate ? 'Профиль закрыт' : 'Профиль открыт'}</div>
          <div className="muted">
            {isPrivate
              ? 'Пробежки и статистику видят только друзья. Вас по-прежнему можно найти поиском и добавить в друзья, но в статистике на главной вы не учитываетесь.'
              : 'Пробежки и статистику видит любой пользователь, а результаты попадают в статистику на главной.'}
          </div>
        </div>
        <Button variant="secondary" className="spacer" disabled={busy} onClick={toggle}>
          {isPrivate ? 'Открыть профиль' : 'Закрыть профиль'}
        </Button>
      </div>
    </Card>
  );
}

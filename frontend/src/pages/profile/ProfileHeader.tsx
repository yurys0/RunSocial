import { ChangeEvent, useRef, useState } from 'react';

import { useAuth } from '../../app/auth-context';
import { deleteAvatar, updateDisplayName, uploadAvatar } from '../../entities/user/api';
import { Avatar, ErrorMessage } from '../../shared/ui';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/** Аватарка и имя редактируются прямо здесь; у чужого профиля — только просмотр. */
export function ProfileHeader({
  displayName,
  login,
  avatarUrl,
  isOwn,
  onChanged,
  children,
}: {
  displayName: string;
  login: string;
  avatarUrl: string | null;
  isOwn: boolean;
  onChanged: () => void;
  children?: React.ReactNode;
}) {
  const { refresh } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
      onChanged();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Подойдёт JPEG, PNG или WebP');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Файл больше 5 МБ');
      return;
    }

    await run(() => uploadAvatar(file));
  };

  const saveName = async () => {
    const value = nameDraft.trim();
    if (!value || value === displayName) {
      setEditingName(false);
      setNameDraft(displayName);
      return;
    }
    if (await run(() => updateDisplayName(value))) {
      setEditingName(false);
    }
  };

  const cancelName = () => {
    setNameDraft(displayName);
    setEditingName(false);
    setError(null);
  };

  return (
    <div className="card">
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <div className="row">
        {isOwn ? (
          <div className="avatar-edit">
            <button
              type="button"
              className="avatar-edit-button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              title="Загрузить новую аватарку"
            >
              <Avatar url={avatarUrl} name={displayName} large />
              {/* Карандаш вместо слова: в круг вписывается при любом размере аватарки */}
              <span className="avatar-edit-hint">{busy ? '…' : '✎'}</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={onFileChosen}
              style={{ display: 'none' }}
            />
            {avatarUrl && (
              <button
                type="button"
                className="avatar-remove"
                disabled={busy}
                title="Удалить аватарку"
                onClick={() => run(deleteAvatar)}
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <Avatar url={avatarUrl} name={displayName} large />
        )}

        <div>
          {editingName ? (
            <div className="row">
              <input
                className="input"
                value={nameDraft}
                autoFocus
                disabled={busy}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveName();
                  if (e.key === 'Escape') cancelName();
                }}
              />
              <button type="button" className="icon-button" title="Сохранить" onClick={saveName}>
                ✓
              </button>
              <button type="button" className="icon-button" title="Отменить" onClick={cancelName}>
                ✕
              </button>
            </div>
          ) : (
            <div className="row">
              <h2 style={{ margin: 0 }}>{displayName}</h2>
              {isOwn && (
                <button
                  type="button"
                  className="icon-button"
                  title="Изменить имя"
                  onClick={() => setEditingName(true)}
                >
                  ✎
                </button>
              )}
            </div>
          )}
          <div className="muted">@{login}</div>
        </div>

        {children}
      </div>
    </div>
  );
}

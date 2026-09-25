import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../app/auth-context';
import { Button, Card, ErrorMessage, Field } from '../../shared/ui';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '', displayName: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form.login, form.password, form.displayName);
      navigate('/feed', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1>Регистрация</h1>
      <Card>
        <form onSubmit={onSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Field
            label="Имя"
            name="displayName"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            required
          />
          <Field
            label="Логин"
            name="login"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            autoComplete="username"
            required
          />
          <Field
            label="Пароль"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Создаём…' : 'Зарегистрироваться'}
          </Button>
          <p className="muted" style={{ marginTop: 12 }}>
            Аватарку можно загрузить после регистрации, в профиле.
          </p>
        </form>
      </Card>
      <p className="muted">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}

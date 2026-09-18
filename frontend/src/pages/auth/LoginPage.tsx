import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../app/auth-context';
import { Button, Card, ErrorMessage, Field } from '../../shared/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form.login, form.password);
      // Возвращаем туда, откуда пользователя увёл ProtectedRoute
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/feed', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1>Вход</h1>
      <Card>
        <form onSubmit={onSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
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
            autoComplete="current-password"
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Входим…' : 'Войти'}
          </Button>
        </form>
      </Card>
      <p className="muted">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}

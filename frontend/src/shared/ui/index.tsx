import { ReactNode } from 'react';

import { apiUrl } from '../api/client';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Button({
  children,
  variant = 'primary',
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  size?: 'sm';
}) {
  // className объединяем, а не перезаписываем: снаружи им задают раскладку
  const classes = ['btn'];
  if (variant === 'secondary') classes.push('btn-secondary');
  if (size === 'sm') classes.push('btn-sm');
  if (className) classes.push(className);
  return (
    <button {...props} className={classes.join(' ')}>
      {children}
    </button>
  );
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="field">
      <label htmlFor={props.name}>{label}</label>
      <input {...props} id={props.name} className="input" />
    </div>
  );
}

export function Avatar({
  url,
  name,
  large,
}: {
  url?: string | null;
  name: string;
  large?: boolean;
}) {
  const className = `avatar${large ? ' avatar-lg' : ''}`;
  return url ? (
    <img src={apiUrl(url)} alt={name} className={className} />
  ) : (
    <span className={className}>{name.charAt(0).toUpperCase()}</span>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return <div className="error">{children}</div>;
}

export function Spinner({ text = 'Загрузка…' }: { text?: string }) {
  return <div className="spinner">{text}</div>;
}

export function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} км`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

/** Темп трекеры отдают в секундах на километр — показываем как «5:30 /км». */
export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')} /км`;
}

export function pluralWord(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} ${many}`;
  if (mod10 === 1) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

/** Интервал вида «7:00 — 8:15». Если трекер не отдал завершение, показываем только старт. */
export function formatTimeRange(startedAt: string, endedAt: string | null): string {
  const time = (value: string) =>
    new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return endedAt ? `${time(startedAt)} — ${time(endedAt)}` : time(startedAt);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'runsocial:token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Ошибка с кодом ответа: по нему страницы отличают 401 от прочего. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function authHeaders(): Record<string, string> {
  const token = tokenStorage.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

/** REST — мутации. FormData без Content-Type: границу multipart ставит браузер. */
export async function rest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const isForm = options.body instanceof FormData;
  const response = await fetch(apiUrl(path), {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
    },
    body: isForm ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(payload) ?? `Ошибка ${response.status}`);
  }
  return payload as T;
}

/** GraphQL — чтение. Apollo не подключаем: нормализующий кэш здесь не нужен. */
export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string; extensions?: { code?: number | string } }>;
  };

  if (payload.errors?.length) {
    const [error] = payload.errors;
    // Код кладёт наш DomainExceptionFilter — по нему отличаем 401 от прочих ошибок
    const status = Number(error.extensions?.code) || 500;
    throw new ApiError(status, error.message);
  }
  return payload.data as T;
}

/** URL для EventSource: заголовки он слать не умеет, токен идёт в query. */
export function sseUrl(path: string): string {
  return `${API_URL}${path}?token=${encodeURIComponent(tokenStorage.get() ?? '')}`;
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const message = (payload as { message?: unknown }).message;
  return typeof message === 'string' ? message : null;
}

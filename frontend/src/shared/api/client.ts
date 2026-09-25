const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export async function rest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const isForm = options.body instanceof FormData;
  const response = await fetch(apiUrl(path), {
    method: options.method ?? 'GET',
    headers: options.body && !isForm ? { 'Content-Type': 'application/json' } : {},
    credentials: 'include',
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

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string; extensions?: { code?: number | string } }>;
  };

  if (payload.errors?.length) {
    const [error] = payload.errors;
    const status = Number(error.extensions?.code) || 500;
    throw new ApiError(status, error.message);
  }
  return payload.data as T;
}

export function sseUrl(path: string): string {
  return apiUrl(path);
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const message = (payload as { message?: unknown }).message;
  return typeof message === 'string' ? message : null;
}

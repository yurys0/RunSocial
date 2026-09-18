import { Logger } from '@nestjs/common';
import { ProxyAgent } from 'undici';

import { TrackerUnavailableError } from '../../domain/trackers.errors';

export type TrackerHttpOptions = {
  baseUrl: string;
  proxy?: string;
  defaultHeaders?: Record<string, string>;
};

export type RequestOptions = {
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined>;
  /** Тело уже сериализовано вызывающим кодом: Pacer подписывает ровно ту строку, что отправляет */
  rawBody?: string;
};

/** Обёртка над fetch: базовый URL, заголовки, прокси. Прокси требует undici ProxyAgent. */
export class TrackerHttp {
  private readonly logger: Logger;
  private readonly name: string;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly dispatcher?: ProxyAgent;

  constructor(name: string, options: TrackerHttpOptions) {
    this.logger = new Logger(`TrackerHttp:${name}`);
    this.name = name;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.defaultHeaders = options.defaultHeaders ?? {};

    const proxy = (options.proxy ?? '').trim();
    this.dispatcher = proxy ? new ProxyAgent(proxy) : undefined;
  }

  async get(path: string, options: RequestOptions = {}): Promise<Response> {
    return this.request('GET', path, options);
  }

  async post(path: string, options: RequestOptions = {}): Promise<Response> {
    return this.request('POST', path, options);
  }

  async getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.parseJson<T>(await this.get(path, options));
  }

  async postJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.parseJson<T>(await this.post(path, options));
  }

  buildQueryString(query: Record<string, string | number | undefined>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    options: RequestOptions,
  ): Promise<Response> {
    const queryString = options.query ? this.buildQueryString(options.query) : '';
    const url = `${this.baseUrl}${path}${queryString ? `?${queryString}` : ''}`;

    this.logger.log(`${method} ${path}${queryString ? `?${queryString}` : ''}`);
    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.defaultHeaders, ...options.headers },
        body: options.rawBody,
        // @ts-expect-error dispatcher — расширение undici, отсутствующее в типах DOM fetch
        dispatcher: this.dispatcher,
      });
      this.logger.log(`${method} ${path} → ${response.status}`);
      return response;
    } catch (error) {
      throw new TrackerUnavailableError(this.name, String(error));
    }
  }

  private async parseJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new TrackerUnavailableError(
        this.name,
        `ответ не является JSON (HTTP ${response.status})`,
      );
    }
  }
}

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Observable } from 'rxjs';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor(config: ConfigService) {
    const options = {
      host: config.get<string>('REDIS_HOST') ?? 'localhost',
      port: Number(config.get<string>('REDIS_PORT') ?? 6379),
      db: Number(config.get<string>('REDIS_CACHE_DB') ?? 0),
    };
    this.publisher = new Redis(options);
    this.subscriber = new Redis(options);
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(payload));
  }

  subscribe<T>(channel: string): Observable<T> {
    return new Observable<T>((observer) => {
      const onMessage = (incomingChannel: string, raw: string) => {
        if (incomingChannel !== channel) return;
        try {
          observer.next(JSON.parse(raw) as T);
        } catch {
          this.logger.warn(`Не удалось разобрать сообщение из канала ${channel}`);
        }
      };

      void this.subscriber.subscribe(channel);
      this.subscriber.on('message', onMessage);

      return () => {
        this.subscriber.off('message', onMessage);
        void this.subscriber.unsubscribe(channel);
      };
    });
  }

  async onModuleDestroy() {
    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
  }
}

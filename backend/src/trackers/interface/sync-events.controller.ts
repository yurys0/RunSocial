import { Controller, Sse, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { map, Observable } from 'rxjs';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RedisService } from '../../shared/redis/redis.service';
import { SyncProgressEvent, syncProgressChannel } from '../infrastructure/sync-queue';

/**
 * Соединение держит API-процесс, события приходят из воркера через Redis pub/sub.
 * Токен — в query: EventSource не умеет слать заголовки.
 */
@ApiTags('Трекеры')
@Controller('trackers/sync')
@UseGuards(JwtAuthGuard)
export class SyncEventsController {
  constructor(private readonly redis: RedisService) {}

  @ApiOperation({ summary: 'SSE-поток прогресса синхронизации' })
  @Sse('events')
  events(@CurrentUser() user: AuthenticatedUser): Observable<{ data: SyncProgressEvent }> {
    return this.redis
      .subscribe<SyncProgressEvent>(syncProgressChannel(user.userId))
      .pipe(map((event) => ({ data: event })));
  }
}

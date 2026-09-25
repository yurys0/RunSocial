import { Controller, Sse, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { map, Observable } from 'rxjs';
import { SuperTokensAuthGuard } from 'supertokens-nestjs';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { RedisService } from '../../shared/redis/redis.service';
import { SyncProgressEvent, syncProgressChannel } from '../infrastructure/sync-queue';

@ApiTags('Трекеры')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Сессия не найдена или истекла', type: ErrorResponseDto })
@Controller('trackers/syncs')
@UseGuards(SuperTokensAuthGuard)
export class SyncEventsController {
  constructor(private readonly redis: RedisService) {}

  @ApiOperation({ summary: 'SSE-поток прогресса синхронизации' })
  @ApiQuery({ name: 'token', description: 'JWT: EventSource не умеет слать заголовок Authorization' })
  @ApiProduces('text/event-stream')
  @ApiOkResponse({
    description: 'Поток событий; в data — JSON со стадиями started, progress, done, error',
    schema: { type: 'string', example: 'data: {"trackerAccountId":"…","provider":"STRAVA","stage":"progress","done":10,"total":40}' },
  })
  @Sse('events')
  events(@CurrentUser() user: AuthenticatedUser): Observable<{ data: SyncProgressEvent }> {
    return this.redis
      .subscribe<SyncProgressEvent>(syncProgressChannel(user.userId))
      .pipe(map((event) => ({ data: event })));
  }
}

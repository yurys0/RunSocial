import { Controller, Sse, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { map, Observable } from 'rxjs';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { RedisService } from '../../shared/redis/redis.service';
import { FriendEvent, friendEventsChannel } from '../infrastructure/friend-events';

@ApiTags('Друзья')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Токен не передан или недействителен', type: ErrorResponseDto })
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendEventsController {
  constructor(private readonly redis: RedisService) {}

  @ApiOperation({ summary: 'SSE-поток событий о заявках в друзья' })
  @ApiQuery({ name: 'token', description: 'JWT: EventSource не умеет слать заголовок Authorization' })
  @ApiProduces('text/event-stream')
  @ApiOkResponse({
    description: 'Поток событий; в data — JSON с type request_received или request_accepted',
    schema: { type: 'string', example: 'data: {"type":"request_received","requestId":"…","from":{"id":"…","login":"runner","displayName":"Иван"}}' },
  })
  @Sse('events')
  events(@CurrentUser() user: AuthenticatedUser): Observable<{ data: FriendEvent }> {
    return this.redis
      .subscribe<FriendEvent>(friendEventsChannel(user.userId))
      .pipe(map((event) => ({ data: event })));
  }
}

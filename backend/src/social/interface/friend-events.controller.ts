import { Controller, Sse, UseGuards } from '@nestjs/common';
import { map, Observable } from 'rxjs';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RedisService } from '../../shared/redis/redis.service';
import { FriendEvent, friendEventsChannel } from '../infrastructure/friend-events';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendEventsController {
  constructor(private readonly redis: RedisService) {}

  @Sse('events')
  events(@CurrentUser() user: AuthenticatedUser): Observable<{ data: FriendEvent }> {
    return this.redis
      .subscribe<FriendEvent>(friendEventsChannel(user.userId))
      .pipe(map((event) => ({ data: event })));
  }
}

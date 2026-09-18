import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { SendFriendRequestDto } from '../application/dto/send-friend-request.dto';
import { RespondFriendRequestUseCase } from '../application/respond-friend-request.use-case';
import { CancelFriendRequestUseCase } from '../application/cancel-friend-request.use-case';
import { RemoveFriendUseCase } from '../application/remove-friend.use-case';
import { SendFriendRequestUseCase } from '../application/send-friend-request.use-case';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(
    private readonly sendRequest: SendFriendRequestUseCase,
    private readonly respondRequest: RespondFriendRequestUseCase,
    private readonly removeFriend: RemoveFriendUseCase,
    private readonly cancelRequest: CancelFriendRequestUseCase,
  ) {}

  @Post('requests')
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendFriendRequestDto) {
    return this.sendRequest.execute(user.userId, dto);
  }

  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.respondRequest.accept(user.userId, id);
  }

  @Post('requests/:id/decline')
  @HttpCode(HttpStatus.OK)
  decline(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.respondRequest.decline(user.userId, id);
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cancelRequest.execute(user.userId, id);
  }

  /** Удаление из друзей: в пути — id пользователя, а не связи */
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string) {
    return this.removeFriend.execute(user.userId, userId);
  }
}

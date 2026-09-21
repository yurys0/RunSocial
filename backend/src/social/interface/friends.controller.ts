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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { SendFriendRequestDto } from '../application/dto/send-friend-request.dto';
import { RespondFriendRequestUseCase } from '../application/respond-friend-request.use-case';
import { CancelFriendRequestUseCase } from '../application/cancel-friend-request.use-case';
import { RemoveFriendUseCase } from '../application/remove-friend.use-case';
import { SendFriendRequestUseCase } from '../application/send-friend-request.use-case';

@ApiTags('Друзья')
@ApiBearerAuth()
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(
    private readonly sendRequest: SendFriendRequestUseCase,
    private readonly respondRequest: RespondFriendRequestUseCase,
    private readonly removeFriend: RemoveFriendUseCase,
    private readonly cancelRequest: CancelFriendRequestUseCase,
  ) {}

  @ApiOperation({ summary: 'Отправить заявку в друзья по логину' })
  @Post('requests')
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendFriendRequestDto) {
    return this.sendRequest.execute(user.userId, dto);
  }

  @ApiOperation({ summary: 'Принять входящую заявку' })
  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.respondRequest.accept(user.userId, id);
  }

  @ApiOperation({ summary: 'Отклонить входящую заявку' })
  @Post('requests/:id/decline')
  @HttpCode(HttpStatus.OK)
  decline(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.respondRequest.decline(user.userId, id);
  }

  @ApiOperation({ summary: 'Отменить свою отправленную заявку' })
  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cancelRequest.execute(user.userId, id);
  }

  /** Удаление из друзей: в пути — id пользователя, а не связи */
  @ApiOperation({ summary: 'Удалить пользователя из друзей' })
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string) {
    return this.removeFriend.execute(user.userId, userId);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { PaginationQueryDto, setPaginationLinks } from '../../shared/pagination/pagination';
import {
  FriendRequestResponseDto,
  SendFriendRequestDto,
} from '../application/dto/send-friend-request.dto';
import { FriendRequestView } from '../application/friend-request-view';
import { ListFriendsUseCase } from '../application/list-friends.use-case';
import { RespondFriendRequestUseCase } from '../application/respond-friend-request.use-case';
import { CancelFriendRequestUseCase } from '../application/cancel-friend-request.use-case';
import { RemoveFriendUseCase } from '../application/remove-friend.use-case';
import { SendFriendRequestUseCase } from '../application/send-friend-request.use-case';
import { UserSummary } from '../application/user-summary';

@ApiTags('Друзья')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Токен не передан или недействителен', type: ErrorResponseDto })
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(
    private readonly sendRequest: SendFriendRequestUseCase,
    private readonly respondRequest: RespondFriendRequestUseCase,
    private readonly removeFriend: RemoveFriendUseCase,
    private readonly cancelRequest: CancelFriendRequestUseCase,
    private readonly listFriends: ListFriendsUseCase,
  ) {}

  @ApiOperation({ summary: 'Список друзей' })
  @ApiOkResponse({
    type: [UserSummary],
    headers: { Link: { description: 'Ссылки prev и next на соседние страницы', schema: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ description: 'Некорректные limit или offset', type: ErrorResponseDto })
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() page: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const items = await this.listFriends.friends(user.userId, page);
    setPaginationLinks(req, res, page, items.length);
    return items;
  }

  @ApiOperation({ summary: 'Входящие заявки, ожидающие ответа' })
  @ApiOkResponse({ type: [FriendRequestView] })
  @Get('requests/incoming')
  incoming(@CurrentUser() user: AuthenticatedUser) {
    return this.listFriends.incoming(user.userId);
  }

  @ApiOperation({ summary: 'Отправленные заявки, ожидающие ответа' })
  @ApiOkResponse({ type: [FriendRequestView] })
  @Get('requests/outgoing')
  outgoing(@CurrentUser() user: AuthenticatedUser) {
    return this.listFriends.outgoing(user.userId);
  }

  @ApiOperation({ summary: 'Отправить заявку в друзья по логину' })
  @ApiCreatedResponse({ description: 'Заявка создана и ждёт ответа', type: FriendRequestResponseDto })
  @ApiBadRequestResponse({ description: 'Ошибка валидации или заявка самому себе', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Пользователь с таким логином не найден', type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'Уже друзья, заявка уже отправлена или есть встречная заявка',
    type: ErrorResponseDto,
  })
  @Post('requests')
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendFriendRequestDto) {
    return this.sendRequest.execute(user.userId, dto);
  }

  @ApiOperation({ summary: 'Принять входящую заявку' })
  @ApiParam({ name: 'id', description: 'Идентификатор заявки', format: 'uuid' })
  @ApiOkResponse({ description: 'Заявка принята, пользователи стали друзьями', type: FriendRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Входящая заявка не найдена', type: ErrorResponseDto })
  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.respondRequest.accept(user.userId, id);
  }

  @ApiOperation({ summary: 'Отклонить входящую заявку' })
  @ApiParam({ name: 'id', description: 'Идентификатор заявки', format: 'uuid' })
  @ApiOkResponse({ description: 'Заявка отклонена', type: FriendRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Входящая заявка не найдена', type: ErrorResponseDto })
  @Post('requests/:id/decline')
  @HttpCode(HttpStatus.OK)
  decline(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.respondRequest.decline(user.userId, id);
  }

  @ApiOperation({ summary: 'Отменить свою отправленную заявку' })
  @ApiParam({ name: 'id', description: 'Идентификатор заявки', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Заявка отменена' })
  @ApiNotFoundResponse({ description: 'Исходящая заявка не найдена', type: ErrorResponseDto })
  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cancelRequest.execute(user.userId, id);
  }

  /** Удаление из друзей: в пути — id пользователя, а не связи */
  @ApiOperation({ summary: 'Удалить пользователя из друзей' })
  @ApiParam({ name: 'userId', description: 'Идентификатор пользователя, а не связи', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Дружба удалена' })
  @ApiNotFoundResponse({ description: 'Пользователь не в друзьях', type: ErrorResponseDto })
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string) {
    return this.removeFriend.execute(user.userId, userId);
  }
}

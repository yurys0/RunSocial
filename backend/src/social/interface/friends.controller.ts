import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
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
import { SuperTokensAuthGuard } from 'supertokens-nestjs';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { setLocation } from '../../shared/http/location';
import { PaginationQueryDto, setPaginationLinks } from '../../shared/pagination/pagination';
import { CancelFriendRequestUseCase } from '../application/cancel-friend-request.use-case';
import {
  FriendRequestDirection,
  FriendRequestResolution,
  FriendRequestsQueryDto,
  RespondFriendRequestDto,
} from '../application/dto/friend-requests.dto';
import {
  FriendRequestResponseDto,
  SendFriendRequestDto,
} from '../application/dto/send-friend-request.dto';
import { FriendRequestView } from '../application/friend-request-view';
import { ListFriendsUseCase } from '../application/list-friends.use-case';
import { RemoveFriendUseCase } from '../application/remove-friend.use-case';
import { RespondFriendRequestUseCase } from '../application/respond-friend-request.use-case';
import { SendFriendRequestUseCase } from '../application/send-friend-request.use-case';
import { UserSummary } from '../application/user-summary';

@ApiTags('Друзья')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Сессия не найдена или истекла', type: ErrorResponseDto })
@Controller('friends')
@UseGuards(SuperTokensAuthGuard)
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

  @ApiOperation({ summary: 'Заявки, ожидающие ответа: входящие или исходящие' })
  @ApiOkResponse({ type: [FriendRequestView] })
  @ApiBadRequestResponse({ description: 'direction не передан или не incoming/outgoing', type: ErrorResponseDto })
  @Get('requests')
  requests(@CurrentUser() user: AuthenticatedUser, @Query() query: FriendRequestsQueryDto) {
    return query.direction === FriendRequestDirection.INCOMING
      ? this.listFriends.incoming(user.userId)
      : this.listFriends.outgoing(user.userId);
  }

  @ApiOperation({ summary: 'Отправить заявку в друзья по логину' })
  @ApiCreatedResponse({
    description: 'Заявка создана и ждёт ответа',
    type: FriendRequestResponseDto,
    headers: { Location: { description: 'Адрес созданной заявки', schema: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ description: 'Ошибка валидации или заявка самому себе', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Пользователь с таким логином не найден', type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'Уже друзья, заявка уже отправлена или есть встречная заявка',
    type: ErrorResponseDto,
  })
  @Post('requests')
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendFriendRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const request = await this.sendRequest.execute(user.userId, dto);
    setLocation(req, res, `/friends/requests/${request.id}`);
    return request;
  }

  @ApiOperation({ summary: 'Ответить на входящую заявку: принять или отклонить' })
  @ApiParam({ name: 'id', description: 'Идентификатор заявки', format: 'uuid' })
  @ApiOkResponse({ description: 'Заявка в новом статусе', type: FriendRequestResponseDto })
  @ApiBadRequestResponse({ description: 'status не ACCEPTED и не DECLINED', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Входящая заявка не найдена', type: ErrorResponseDto })
  @Patch('requests/:id')
  respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RespondFriendRequestDto,
  ) {
    return dto.status === FriendRequestResolution.ACCEPTED
      ? this.respondRequest.accept(user.userId, id)
      : this.respondRequest.decline(user.userId, id);
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

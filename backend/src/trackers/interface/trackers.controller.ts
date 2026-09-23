import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
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
import { ConnectTrackerUseCase } from '../application/connect-tracker.use-case';
import { DisconnectTrackerUseCase } from '../application/disconnect-tracker.use-case';
import { ConnectTrackerDto, SyncAcceptedResponseDto } from '../application/dto/connect-tracker.dto';
import { InitiateSyncUseCase } from '../application/initiate-sync.use-case';
import { ListTrackerAccountsUseCase } from '../application/list-tracker-accounts.use-case';
import { TrackerAccountView } from '../application/tracker-account-view';

@ApiTags('Трекеры')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Сессия не найдена или истекла', type: ErrorResponseDto })
@Controller('trackers')
@UseGuards(SuperTokensAuthGuard)
export class TrackersController {
  constructor(
    private readonly connectTracker: ConnectTrackerUseCase,
    private readonly listAccounts: ListTrackerAccountsUseCase,
    private readonly disconnectTracker: DisconnectTrackerUseCase,
    private readonly initiateSync: InitiateSyncUseCase,
  ) {}

  @ApiOperation({ summary: 'Привязанные трекеры пользователя' })
  @ApiOkResponse({ type: [TrackerAccountView] })
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.listAccounts.execute(user.userId);
  }

  @ApiOperation({ summary: 'Привязать трекер' })
  @ApiCreatedResponse({
    description: 'Трекер привязан, учётные данные проверены',
    type: TrackerAccountView,
    headers: { Location: { description: 'Адрес созданной привязки', schema: { type: 'string' } } },
  })
  @ApiBadRequestResponse({
    description: 'Ошибка валидации, трекер отверг логин/пароль или недоступен',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({ description: 'Такой трекер уже привязан', type: ErrorResponseDto })
  @Post()
  async connect(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConnectTrackerDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const account = await this.connectTracker.execute(user.userId, dto);
    setLocation(req, res, `/trackers/${account.id}`);
    return account;
  }

  @ApiOperation({ summary: 'Отвязать трекер' })
  @ApiParam({ name: 'id', description: 'Идентификатор привязки', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Привязка удалена вместе с импортированными пробежками' })
  @ApiNotFoundResponse({ description: 'Привязка не найдена или чужая', type: ErrorResponseDto })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disconnectTracker.execute(user, id);
  }

  @ApiOperation({ summary: 'Создать синхронизацию: задача уходит в очередь, прогресс — в SSE' })
  @ApiParam({ name: 'id', description: 'Идентификатор привязки', format: 'uuid' })
  @ApiAcceptedResponse({ description: 'Задача поставлена в очередь', type: SyncAcceptedResponseDto })
  @ApiNotFoundResponse({ description: 'Привязка не найдена или чужая', type: ErrorResponseDto })
  @Post(':id/syncs')
  @HttpCode(HttpStatus.ACCEPTED)
  sync(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.initiateSync.execute(user, id);
  }
}

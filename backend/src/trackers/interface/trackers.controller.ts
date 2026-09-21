import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ConnectTrackerUseCase } from '../application/connect-tracker.use-case';
import { DisconnectTrackerUseCase } from '../application/disconnect-tracker.use-case';
import { ConnectTrackerDto } from '../application/dto/connect-tracker.dto';
import { InitiateSyncUseCase } from '../application/initiate-sync.use-case';
import { ListTrackerAccountsUseCase } from '../application/list-tracker-accounts.use-case';

@ApiTags('Трекеры')
@ApiBearerAuth()
@Controller('trackers')
@UseGuards(JwtAuthGuard)
export class TrackersController {
  constructor(
    private readonly connectTracker: ConnectTrackerUseCase,
    private readonly listAccounts: ListTrackerAccountsUseCase,
    private readonly disconnectTracker: DisconnectTrackerUseCase,
    private readonly initiateSync: InitiateSyncUseCase,
  ) {}

  @ApiOperation({ summary: 'Привязанные трекеры пользователя' })
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.listAccounts.execute(user.userId);
  }

  @ApiOperation({ summary: 'Привязать трекер' })
  @Post()
  connect(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConnectTrackerDto) {
    return this.connectTracker.execute(user.userId, dto);
  }

  @ApiOperation({ summary: 'Отвязать трекер' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disconnectTracker.execute(user.userId, id);
  }

  /** Ставит задачу в очередь и сразу отвечает; прогресс придёт через SSE. */
  @ApiOperation({ summary: 'Запустить синхронизацию: задача уходит в очередь, прогресс — в SSE' })
  @Post(':id/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  sync(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.initiateSync.execute(user.userId, id);
  }
}

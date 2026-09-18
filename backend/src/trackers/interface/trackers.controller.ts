import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ConnectTrackerUseCase } from '../application/connect-tracker.use-case';
import { DisconnectTrackerUseCase } from '../application/disconnect-tracker.use-case';
import { ConnectTrackerDto } from '../application/dto/connect-tracker.dto';
import { InitiateSyncUseCase } from '../application/initiate-sync.use-case';
import { ListTrackerAccountsUseCase } from '../application/list-tracker-accounts.use-case';

@Controller('trackers')
@UseGuards(JwtAuthGuard)
export class TrackersController {
  constructor(
    private readonly connectTracker: ConnectTrackerUseCase,
    private readonly listAccounts: ListTrackerAccountsUseCase,
    private readonly disconnectTracker: DisconnectTrackerUseCase,
    private readonly initiateSync: InitiateSyncUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.listAccounts.execute(user.userId);
  }

  @Post()
  connect(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConnectTrackerDto) {
    return this.connectTracker.execute(user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disconnectTracker.execute(user.userId, id);
  }

  /** Ставит задачу в очередь и сразу отвечает; прогресс придёт через SSE. */
  @Post(':id/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  sync(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.initiateSync.execute(user.userId, id);
  }
}

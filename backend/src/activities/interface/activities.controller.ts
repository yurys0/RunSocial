import { Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { LikeActivityUseCase } from '../application/like-activity.use-case';

@ApiTags('Пробежки')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly likeActivity: LikeActivityUseCase) {}

  @ApiOperation({ summary: 'Поставить лайк чужой пробежке' })
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  like(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.likeActivity.like(user.userId, id);
  }

  @ApiOperation({ summary: 'Снять лайк' })
  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  unlike(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.likeActivity.unlike(user.userId, id);
  }
}

import { Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { LikeActivityUseCase } from '../application/like-activity.use-case';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly likeActivity: LikeActivityUseCase) {}

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  like(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.likeActivity.like(user.userId, id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  unlike(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.likeActivity.unlike(user.userId, id);
  }
}

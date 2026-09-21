import {
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { PaginationQueryDto, setPaginationLinks } from '../../shared/pagination/pagination';
import { GetActivityUseCase } from '../application/get-activity.use-case';
import { GetFeedUseCase } from '../application/get-feed.use-case';
import { LikeActivityUseCase } from '../application/like-activity.use-case';

@ApiTags('Пробежки')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(
    private readonly getFeed: GetFeedUseCase,
    private readonly getActivity: GetActivityUseCase,
    private readonly likeActivity: LikeActivityUseCase,
  ) {}

  @ApiOperation({ summary: 'Лента: свои пробежки и пробежки друзей, новые первыми' })
  @Get()
  async feed(
    @CurrentUser() user: AuthenticatedUser,
    @Query() page: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const items = await this.getFeed.execute(user.userId, page);
    setPaginationLinks(req, res, page, items.length);
    return items;
  }

  @ApiOperation({ summary: 'Одна пробежка без маршрута' })
  @Get(':id')
  one(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.getActivity.execute(id, user.userId);
  }

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

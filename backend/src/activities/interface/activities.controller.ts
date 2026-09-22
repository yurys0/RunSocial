import { Controller, Delete, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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
import { setLocation } from '../../shared/http/location';
import { PaginationQueryDto, setPaginationLinks } from '../../shared/pagination/pagination';
import { ActivityView } from '../application/activity-view';
import { LikeCountResponseDto } from '../application/dto/like-count.dto';
import { GetActivityUseCase } from '../application/get-activity.use-case';
import { GetFeedUseCase } from '../application/get-feed.use-case';
import { LikeActivityUseCase } from '../application/like-activity.use-case';

@ApiTags('Пробежки')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Токен не передан или недействителен', type: ErrorResponseDto })
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(
    private readonly getFeed: GetFeedUseCase,
    private readonly getActivity: GetActivityUseCase,
    private readonly likeActivity: LikeActivityUseCase,
  ) {}

  @ApiOperation({ summary: 'Лента: свои пробежки и пробежки друзей, новые первыми' })
  @ApiOkResponse({
    type: [ActivityView],
    headers: { Link: { description: 'Ссылки prev и next на соседние страницы', schema: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ description: 'Некорректные limit или offset', type: ErrorResponseDto })
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
  @ApiParam({ name: 'id', description: 'Идентификатор пробежки', format: 'uuid' })
  @ApiOkResponse({ type: ActivityView })
  @ApiNotFoundResponse({ description: 'Пробежка не найдена или её профиль закрыт', type: ErrorResponseDto })
  @Get(':id')
  one(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.getActivity.execute(id, user.userId);
  }

  @ApiOperation({ summary: 'Поставить лайк чужой пробежке' })
  @ApiParam({ name: 'id', description: 'Идентификатор пробежки', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Лайк создан',
    type: LikeCountResponseDto,
    headers: { Location: { description: 'Адрес созданного лайка', schema: { type: 'string' } } },
  })
  @ApiForbiddenResponse({ description: 'Нельзя лайкнуть свою пробежку', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Пробежка не найдена или её профиль закрыт', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Лайк уже стоит', type: ErrorResponseDto })
  @Post(':id/likes')
  async like(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.likeActivity.like(user.userId, id);
    setLocation(req, res, `/activities/${id}/likes/me`);
    return result;
  }

  @ApiOperation({ summary: 'Снять свой лайк' })
  @ApiParam({ name: 'id', description: 'Идентификатор пробежки', format: 'uuid' })
  @ApiOkResponse({ description: 'Лайк снят, в ответе актуальный счётчик', type: LikeCountResponseDto })
  @ApiNotFoundResponse({ description: 'Лайка не было', type: ErrorResponseDto })
  @Delete(':id/likes/me')
  unlike(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.likeActivity.unlike(user.userId, id);
  }
}

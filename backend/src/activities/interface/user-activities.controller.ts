import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
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
import { PaginationQueryDto, setPaginationLinks } from '../../shared/pagination/pagination';
import { ActivityView } from '../application/activity-view';
import { GetUserActivitiesUseCase } from '../application/get-user-activities.use-case';

@ApiTags('Пробежки')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Сессия не найдена или истекла', type: ErrorResponseDto })
@Controller('users/:login/activities')
@UseGuards(SuperTokensAuthGuard)
export class UserActivitiesController {
  constructor(private readonly getUserActivities: GetUserActivitiesUseCase) {}

  @ApiOperation({ summary: 'Пробежки пользователя по логину, новые первыми' })
  @ApiParam({ name: 'login', example: 'runner' })
  @ApiOkResponse({
    type: [ActivityView],
    headers: { Link: { description: 'Ссылки prev и next на соседние страницы', schema: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ description: 'Некорректные limit или offset', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Профиль закрыт, а вы не в друзьях', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Пользователь не найден', type: ErrorResponseDto })
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('login') login: string,
    @Query() page: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const items = await this.getUserActivities.byLogin(login, user.userId, page);
    setPaginationLinks(req, res, page, items.length);
    return items;
  }
}

import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { PaginationQueryDto, setPaginationLinks } from '../../shared/pagination/pagination';
import { GetUserActivitiesUseCase } from '../application/get-user-activities.use-case';

// не в identity: тот модуль про пробежки не знает
@ApiTags('Пробежки')
@ApiBearerAuth()
@Controller('users/:login/activities')
@UseGuards(JwtAuthGuard)
export class UserActivitiesController {
  constructor(private readonly getUserActivities: GetUserActivitiesUseCase) {}

  @ApiOperation({ summary: 'Пробежки пользователя по логину, новые первыми' })
  @ApiParam({ name: 'login', example: 'runner' })
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

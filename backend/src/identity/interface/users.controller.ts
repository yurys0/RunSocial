import { Body, Controller, Delete, Get, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AvatarUseCase } from '../application/avatar.use-case';
import {
  ConfirmAvatarDto,
  CreateAvatarUploadUrlDto,
  UpdatePrivacyDto,
  UpdateProfileDto,
} from '../application/dto/profile.dto';
import { GetProfileUseCase } from '../application/get-profile.use-case';
import { UpdateProfileUseCase } from '../application/update-profile.use-case';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@ApiTags('Профиль')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly avatar: AvatarUseCase,
  ) {}

  @ApiOperation({ summary: 'Свой профиль' })
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.getProfile.execute(user.userId);
  }

  @ApiOperation({ summary: 'Изменить отображаемое имя' })
  @Patch('me')
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.updateProfile.execute(user.userId, dto);
  }

  @ApiOperation({ summary: 'Переключить приватность профиля' })
  @Patch('me/privacy')
  updatePrivacy(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePrivacyDto) {
    return this.updateProfile.setPrivacy(user.userId, dto.isPrivate);
  }

  /** Шаг 1: ссылка для прямой загрузки в S3 */
  @ApiOperation({ summary: 'Ссылка на прямую загрузку аватарки в хранилище' })
  @Post('me/avatar/upload-url')
  createAvatarUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAvatarUploadUrlDto,
  ) {
    return this.avatar.createUploadUrl(user.userId, dto.contentType, dto.contentLength);
  }

  /** Шаг 2: подтверждение загруженного ключа */
  @ApiOperation({ summary: 'Подтвердить загруженную аватарку' })
  @Put('me/avatar')
  confirmAvatar(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmAvatarDto) {
    return this.avatar.confirm(user.userId, dto.key);
  }

  @ApiOperation({ summary: 'Удалить аватарку' })
  @Delete('me/avatar')
  deleteAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.avatar.remove(user.userId);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AvatarUseCase, UploadedImage } from '../application/avatar.use-case';
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  UpdatePrivacyDto,
  UpdateProfileDto,
} from '../application/dto/profile.dto';
import { GetProfileUseCase } from '../application/get-profile.use-case';
import { UpdateProfileUseCase } from '../application/update-profile.use-case';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

// тип проверяется по сигнатуре файла, а не по заголовку из браузера
const avatarFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_AVATAR_BYTES }),
    new FileTypeValidator({ fileType: new RegExp(`^(${ALLOWED_AVATAR_TYPES.join('|')})$`) }),
  ],
  exceptionFactory: () => new BadRequestException('Подойдёт JPEG, PNG или WebP не больше 5 МБ'),
});

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

  @ApiOperation({ summary: 'Загрузить аватарку: multipart, поле file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary', description: 'JPEG, PNG или WebP до 5 МБ' } },
    },
  })
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@CurrentUser() user: AuthenticatedUser, @UploadedFile(avatarFilePipe) file: UploadedImage) {
    return this.avatar.upload(user.userId, file);
  }

  @ApiOperation({ summary: 'Удалить аватарку' })
  @Delete('me/avatar')
  deleteAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.avatar.remove(user.userId);
  }
}

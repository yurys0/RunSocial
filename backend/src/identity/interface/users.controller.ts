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
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { AvatarUseCase, UploadedImage } from '../application/avatar.use-case';
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  UpdateProfileDto,
} from '../application/dto/profile.dto';
import { GetProfileUseCase } from '../application/get-profile.use-case';
import { UpdateProfileUseCase } from '../application/update-profile.use-case';
import { UserView } from '../application/user-view';
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
@ApiUnauthorizedResponse({ description: 'Токен не передан или недействителен', type: ErrorResponseDto })
@ApiNotFoundResponse({ description: 'Пользователь из токена не найден', type: ErrorResponseDto })
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly avatar: AvatarUseCase,
  ) {}

  @ApiOperation({ summary: 'Свой профиль' })
  @ApiOkResponse({ type: UserView })
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.getProfile.execute(user.userId);
  }

  @ApiOperation({ summary: 'Изменить имя и приватность: любое подмножество полей' })
  @ApiOkResponse({ description: 'Обновлённый профиль', type: UserView })
  @ApiBadRequestResponse({ description: 'Ошибка валидации полей', type: ErrorResponseDto })
  @Patch('me')
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.updateProfile.execute(user.userId, dto);
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
  @ApiOkResponse({ description: 'Профиль с новой аватаркой', type: UserView })
  @ApiBadRequestResponse({ description: 'Файла нет, не тот тип или больше 5 МБ', type: ErrorResponseDto })
  @Put('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@CurrentUser() user: AuthenticatedUser, @UploadedFile(avatarFilePipe) file: UploadedImage) {
    return this.avatar.upload(user.userId, file);
  }

  @ApiOperation({ summary: 'Удалить аватарку' })
  @ApiOkResponse({ description: 'Профиль без аватарки', type: UserView })
  @Delete('me/avatar')
  deleteAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.avatar.remove(user.userId);
  }
}

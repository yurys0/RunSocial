import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
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
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SuperTokensAuthGuard } from 'supertokens-nestjs';

import { AuthenticatedUser } from '../../shared/auth/authenticated-user';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { AvatarUseCase, UploadedImage } from '../application/avatar.use-case';
import { DeleteUserUseCase } from '../application/delete-user.use-case';
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  UpdateUserDto,
} from '../application/dto/profile.dto';
import { GetProfileUseCase } from '../application/get-profile.use-case';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import { UserView } from '../application/user-view';
import { ForeignProfileError } from '../domain/identity.errors';

// тип проверяется по сигнатуре файла, а не по заголовку из браузера
const avatarFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_AVATAR_BYTES }),
    new FileTypeValidator({ fileType: new RegExp(`^(${ALLOWED_AVATAR_TYPES.join('|')})$`) }),
  ],
  exceptionFactory: () => new BadRequestException('Подойдёт JPEG, PNG или WebP не больше 5 МБ'),
});

const SELF = 'me';

@ApiTags('Пользователи')
@ApiCookieAuth()
@ApiParam({ name: 'id', description: `Идентификатор пользователя или «${SELF}»`, example: SELF })
@ApiUnauthorizedResponse({ description: 'Сессия не найдена или истекла', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: 'Чужой профиль или не хватает прав', type: ErrorResponseDto })
@ApiNotFoundResponse({ description: 'Пользователь не найден', type: ErrorResponseDto })
@Controller('users')
@UseGuards(SuperTokensAuthGuard)
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
    private readonly avatar: AvatarUseCase,
  ) {}

  @ApiOperation({ summary: 'Профиль пользователя: свой или, для администратора, любой' })
  @ApiOkResponse({ type: UserView })
  @Get(':id')
  one(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.getProfile.execute(user, resolveUserId(user, id));
  }

  @ApiOperation({ summary: 'Изменить профиль: любое подмножество полей' })
  @ApiOkResponse({ description: 'Обновлённый профиль', type: UserView })
  @ApiBadRequestResponse({ description: 'Ошибка валидации полей', type: ErrorResponseDto })
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUser.execute(user, resolveUserId(user, id), dto);
  }

  @ApiOperation({ summary: 'Удалить пользователя вместе со всеми его данными' })
  @ApiNoContentResponse({ description: 'Пользователь удалён' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.deleteUser.execute(user, resolveUserId(user, id));
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
  @Put(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile(avatarFilePipe) file: UploadedImage,
  ) {
    // Загружать картинку за другого нельзя даже администратору — он может только удалить
    if (resolveUserId(user, id) !== user.userId) {
      throw new ForeignProfileError();
    }
    return this.avatar.upload(user.userId, file);
  }

  @ApiOperation({ summary: 'Удалить аватарку' })
  @ApiOkResponse({ description: 'Профиль без аватарки', type: UserView })
  @Delete(':id/avatar')
  deleteAvatar(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.avatar.remove(user, resolveUserId(user, id));
  }
}

function resolveUserId(user: AuthenticatedUser, id: string): string {
  return id === SELF ? user.userId : id;
}

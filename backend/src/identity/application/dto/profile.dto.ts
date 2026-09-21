import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Иван Петров' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;
}

export class UpdatePrivacyDto {
  @ApiProperty({ description: 'Закрытый профиль: пробежки видны только друзьям' })
  @IsBoolean()
  isPrivate: boolean;
}

export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export class CreateAvatarUploadUrlDto {
  @ApiProperty({ enum: ALLOWED_AVATAR_TYPES })
  @IsIn(ALLOWED_AVATAR_TYPES)
  contentType: string;

  @ApiProperty({ maximum: MAX_AVATAR_BYTES, description: 'Размер файла в байтах: входит в подпись ссылки' })
  @IsInt()
  @Min(1)
  @Max(MAX_AVATAR_BYTES)
  contentLength: number;
}

export class ConfirmAvatarDto {
  @ApiProperty({ description: 'Ключ объекта в хранилище, полученный вместе со ссылкой' })
  @IsString()
  @MinLength(1)
  key: string;
}

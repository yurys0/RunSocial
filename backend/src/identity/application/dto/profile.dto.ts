import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

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

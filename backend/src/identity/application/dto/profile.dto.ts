import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { UserRole } from '../../domain/user-role';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Иван Петров' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Закрытый профиль: пробежки видны только друзьям' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ example: 'runner', description: 'Логин; менять может только администратор' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  login?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Роль; менять может только администратор' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

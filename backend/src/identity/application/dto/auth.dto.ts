import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { UserView } from '../user-view';

export class RegisterUserDto {
  @ApiProperty({ example: 'runner', description: 'Уникальный логин' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  login: string;

  @ApiProperty({ description: 'Пароль; требований к сложности нет' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiProperty({ example: 'Иван Петров', description: 'Отображаемое имя' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'runner' })
  @IsString()
  @MinLength(1)
  login: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT для заголовка Authorization: Bearer <token>' })
  accessToken: string;

  @ApiProperty({ type: () => UserView })
  user: UserView;
}

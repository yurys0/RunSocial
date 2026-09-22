import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { AuthResponseDto, LoginDto, RegisterUserDto } from '../application/dto/auth.dto';
import { LoginUserUseCase } from '../application/login-user.use-case';
import { RegisterUserUseCase } from '../application/register-user.use-case';

@ApiTags('Аутентификация')
@ApiTooManyRequestsResponse({ description: 'Больше 5 попыток за минуту', type: ErrorResponseDto })
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Регистрация' })
  @ApiCreatedResponse({ description: 'Пользователь создан, токен выдан', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Ошибка валидации полей', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Логин уже занят', type: ErrorResponseDto })
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.registerUser.execute(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Вход по логину и паролю' })
  @ApiOkResponse({ description: 'Токен выдан', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Ошибка валидации или неверный логин/пароль', type: ErrorResponseDto })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.loginUser.execute(dto);
  }
}

import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { LoginDto, RegisterUserDto } from '../application/dto/auth.dto';
import { LoginUserUseCase } from '../application/login-user.use-case';
import { RegisterUserUseCase } from '../application/register-user.use-case';

@ApiTags('Аутентификация')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
  ) {}

  // Защита от перебора паролей
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Регистрация: возвращает JWT на 24 часа' })
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.registerUser.execute(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Вход по логину и паролю' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.loginUser.execute(dto);
  }
}

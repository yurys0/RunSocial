import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AvatarUseCase } from './application/avatar.use-case';
import { GetProfileUseCase } from './application/get-profile.use-case';
import { LoginUserUseCase } from './application/login-user.use-case';
import { PasswordHasher } from './application/password-hasher';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { USER_REPOSITORY } from './domain/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { AuthController } from './interface/auth.controller';
import { UsersController } from './interface/users.controller';

@Module({
  // Лимиты нужны только на /auth/register и /auth/login, поэтому троттлер настроен здесь
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
  controllers: [AuthController, UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    PasswordHasher,
    RegisterUserUseCase,
    LoginUserUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    AvatarUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class IdentityModule {}

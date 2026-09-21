import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { LoginAlreadyTakenError } from '../domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { RegisterUserDto } from './dto/auth.dto';
import { PasswordHasher } from './password-hasher';
import { toUserView, UserView } from './user-view';

export type AuthResult = { accessToken: string; user: UserView };

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async execute(dto: RegisterUserDto): Promise<AuthResult> {
    if (await this.users.existsByLogin(dto.login)) {
      throw new LoginAlreadyTakenError(dto.login);
    }

    const user = await this.users.create({
      login: dto.login,
      passwordHash: await this.hasher.hash(dto.password),
      displayName: dto.displayName,
    });

    // Токен выдаём сразу — иначе фронт вынужден дёргать логин вторым запросом
    const accessToken = await this.jwt.signAsync({ userId: user.id, login: user.login });
    return { accessToken, user: toUserView(user) };
  }
}

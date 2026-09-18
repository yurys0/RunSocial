import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { S3Service } from '../../shared/storage/s3.service';
import { InvalidCredentialsError } from '../domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { LoginDto } from './dto/auth.dto';
import { PasswordHasher } from './password-hasher';
import { AuthResult } from './register-user.use-case';
import { toUserView } from './user-view';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
    private readonly s3: S3Service,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByLogin(dto.login);
    if (!user || !(await this.hasher.compare(dto.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.jwt.signAsync({ userId: user.id, login: user.login });
    return { accessToken, user: toUserView(user, this.s3) };
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { S3Service } from '../../shared/storage/s3.service';
import { UserNotFoundError } from '../domain/identity.errors';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { toUserView, UserView } from './user-view';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly s3: S3Service,
  ) {}

  async execute(userId: string): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return toUserView(user, this.s3);
  }
}

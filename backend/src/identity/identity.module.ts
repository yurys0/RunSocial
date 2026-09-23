import { Module } from '@nestjs/common';

import { AvatarUseCase } from './application/avatar.use-case';
import { DeleteUserUseCase } from './application/delete-user.use-case';
import { GetProfileUseCase } from './application/get-profile.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
import { ACCOUNT_GATEWAY } from './domain/account.gateway';
import { USER_REPOSITORY } from './domain/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { SuperTokensAccountGateway } from './infrastructure/supertokens-account.gateway';
import { AvatarsController } from './interface/avatars.controller';
import { IdentityResolver } from './interface/identity.resolver';
import { UsersController } from './interface/users.controller';

@Module({
  controllers: [UsersController, AvatarsController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: ACCOUNT_GATEWAY, useClass: SuperTokensAccountGateway },
    GetProfileUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    AvatarUseCase,
    IdentityResolver,
  ],
  exports: [USER_REPOSITORY, ACCOUNT_GATEWAY],
})
export class IdentityModule {}

import { Inject, Module, OnModuleInit } from '@nestjs/common';

import { ACCOUNT_GATEWAY, AccountGateway } from '../identity/domain/account.gateway';
import { IdentityModule } from '../identity/identity.module';
import { GetUserUseCase } from './application/get-user.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import { ADMIN_REPOSITORY } from './domain/admin.repository';
import { PrismaAdminRepository } from './infrastructure/prisma-admin.repository';
import { AdminResolver } from './interface/admin.resolver';

/** Только чтение: изменения идут в обычные ресурсы /users, /activities и /trackers. */
@Module({
  imports: [IdentityModule],
  providers: [
    { provide: ADMIN_REPOSITORY, useClass: PrismaAdminRepository },
    ListUsersUseCase,
    GetUserUseCase,
    AdminResolver,
  ],
})
export class AdminModule implements OnModuleInit {
  constructor(@Inject(ACCOUNT_GATEWAY) private readonly accounts: AccountGateway) {}

  /** Роль должна существовать до того, как её выдадут первому администратору вручную. */
  onModuleInit(): Promise<void> {
    return this.accounts.ensureAdminRole();
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { ACCOUNT_GATEWAY, AccountGateway } from '../../identity/domain/account.gateway';
import { UserNotFoundError } from '../../identity/domain/identity.errors';
import { ADMIN_REPOSITORY, AdminRepository } from '../domain/admin.repository';
import { AdminUserDetailsView, toAdminUserDetailsView } from './admin-user-view';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly admin: AdminRepository,
    @Inject(ACCOUNT_GATEWAY) private readonly accounts: AccountGateway,
  ) {}

  async execute(userId: string, activitiesLimit: number): Promise<AdminUserDetailsView> {
    const row = await this.admin.findUser(userId, activitiesLimit);
    if (!row) {
      throw new UserNotFoundError();
    }

    const isAdmin = await this.accounts.isAdmin(userId);
    return toAdminUserDetailsView(row, new Set(isAdmin ? [userId] : []));
  }
}

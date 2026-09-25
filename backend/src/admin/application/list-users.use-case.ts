import { Inject, Injectable } from '@nestjs/common';

import { ACCOUNT_GATEWAY, AccountGateway } from '../../identity/domain/account.gateway';
import { ADMIN_REPOSITORY, AdminRepository } from '../domain/admin.repository';
import { AdminUserView, toAdminUserView } from './admin-user-view';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly admin: AdminRepository,
    @Inject(ACCOUNT_GATEWAY) private readonly accounts: AccountGateway,
  ) {}

  async execute(query: string, limit: number, offset: number): Promise<AdminUserView[]> {
    const [rows, adminIds] = await Promise.all([
      this.admin.listUsers(query.trim(), limit, offset),
      this.accounts.listAdminIds(),
    ]);
    const admins = new Set(adminIds);

    return rows.map((row) => toAdminUserView(row, admins));
  }
}

import { Injectable } from '@nestjs/common';
import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import UserRoles from 'supertokens-node/recipe/userroles';

import { ADMIN_ROLE } from '../../shared/auth/roles';
import { AccountGateway } from '../domain/account.gateway';
import { LoginAlreadyTakenError, UserNotFoundError } from '../domain/identity.errors';

const TENANT_ID = 'public';

@Injectable()
export class SuperTokensAccountGateway implements AccountGateway {
  async ensureAdminRole(): Promise<void> {
    await UserRoles.createNewRoleOrAddPermissions(ADMIN_ROLE, []);
  }

  async changeLogin(userId: string, login: string): Promise<void> {
    const result = await EmailPassword.updateEmailOrPassword({
      recipeUserId: supertokens.convertToRecipeUserId(userId),
      email: login,
    });

    if (result.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
      throw new LoginAlreadyTakenError(login);
    }
    if (result.status !== 'OK') {
      throw new UserNotFoundError();
    }
  }

  async delete(userId: string): Promise<void> {
    await supertokens.deleteUser(userId);
  }

  async isAdmin(userId: string): Promise<boolean> {
    const { roles } = await UserRoles.getRolesForUser(TENANT_ID, userId);
    return roles.includes(ADMIN_ROLE);
  }

  async setAdmin(userId: string, isAdmin: boolean): Promise<void> {
    if (isAdmin) {
      await UserRoles.addRoleToUser(TENANT_ID, userId, ADMIN_ROLE);
    } else {
      await UserRoles.removeUserRole(TENANT_ID, userId, ADMIN_ROLE);
    }
    await Session.revokeAllSessionsForUser(userId);
  }

  async listAdminIds(): Promise<string[]> {
    const result = await UserRoles.getUsersThatHaveRole(TENANT_ID, ADMIN_ROLE);
    return result.status === 'OK' ? result.users : [];
  }
}

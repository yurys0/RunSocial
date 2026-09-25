export const ACCOUNT_GATEWAY = Symbol('ACCOUNT_GATEWAY');

export interface AccountGateway {
  ensureAdminRole(): Promise<void>;
  changeLogin(userId: string, login: string): Promise<void>;
  delete(userId: string): Promise<void>;
  isAdmin(userId: string): Promise<boolean>;
  setAdmin(userId: string, isAdmin: boolean): Promise<void>;
  listAdminIds(): Promise<string[]>;
}

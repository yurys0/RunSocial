import { User } from './user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/** id приходит из SuperTokens: профиль и аккаунт в ядре — это один и тот же пользователь. */
export type CreateUserData = {
  id: string;
  login: string;
  displayName: string;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  search(query: string, limit: number, excludeUserId?: string): Promise<User[]>;
  findManyByIds(ids: string[]): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

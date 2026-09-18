import { User } from './user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type CreateUserData = {
  login: string;
  passwordHash: string;
  displayName: string;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  existsByLogin(login: string): Promise<boolean>;
  search(query: string, limit: number, excludeUserId?: string): Promise<User[]>;
  findManyByIds(ids: string[]): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  save(user: User): Promise<User>;
}

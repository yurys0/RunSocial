import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/domain-error';

export class LoginAlreadyTakenError extends ConflictError {
  constructor(login: string) {
    super(`Логин "${login}" уже занят`);
  }
}

export class InvalidCredentialsError extends ValidationError {
  constructor() {
    // Намеренно не уточняем, логин или пароль неверен
    super('Неверный логин или пароль');
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('Пользователь не найден');
  }
}

export class AvatarNotFoundError extends NotFoundError {
  constructor() {
    super('Аватарка не найдена');
  }
}

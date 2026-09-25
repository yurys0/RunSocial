import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/domain-error';

export class LoginAlreadyTakenError extends ConflictError {
  constructor(login: string) {
    super(`Логин "${login}" уже занят`);
  }
}

export class InvalidCredentialsError extends ValidationError {
  constructor() {
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

export class ForeignProfileError extends ForbiddenError {
  constructor() {
    super('Можно менять только свой профиль');
  }
}

export class AdminRightsRequiredError extends ForbiddenError {
  constructor() {
    super('Действие доступно только администратору');
  }
}

export class CannotChangeOwnRoleError extends ForbiddenError {
  constructor() {
    super('Нельзя снять с себя права администратора');
  }
}

export class CannotDeleteYourselfError extends ForbiddenError {
  constructor() {
    super('Нельзя удалить собственный аккаунт');
  }
}

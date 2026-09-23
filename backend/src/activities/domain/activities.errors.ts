import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/domain-error';

export class ActivityNotFoundError extends NotFoundError {
  constructor() {
    super('Активность не найдена');
  }
}

export class CannotLikeOwnActivityError extends ForbiddenError {
  constructor() {
    super('Нельзя лайкнуть собственную активность');
  }
}

export class AlreadyLikedError extends ConflictError {
  constructor() {
    super('Активность уже лайкнута');
  }
}

export class LikeNotFoundError extends NotFoundError {
  constructor() {
    super('Лайк не найден');
  }
}

export class ProfileIsPrivateError extends ForbiddenError {
  constructor() {
    super('Профиль закрыт: пробежки видны только друзьям');
  }
}

export class ForeignActivityError extends ForbiddenError {
  constructor() {
    super('Можно удалять только свои пробежки');
  }
}

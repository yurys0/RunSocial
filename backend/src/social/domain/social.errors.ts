import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/domain-error';

export class CannotFriendYourselfError extends ValidationError {
  constructor() {
    super('Нельзя отправить заявку самому себе');
  }
}

export class AlreadyFriendsError extends ConflictError {
  constructor() {
    super('Вы уже друзья');
  }
}

export class FriendRequestAlreadySentError extends ConflictError {
  constructor() {
    super('Заявка уже отправлена и ожидает ответа');
  }
}

export class IncomingRequestExistsError extends ConflictError {
  constructor() {
    super('Этот пользователь уже отправил вам заявку — примите её');
  }
}

export class FriendRequestNotFoundError extends NotFoundError {
  constructor() {
    super('Заявка не найдена');
  }
}

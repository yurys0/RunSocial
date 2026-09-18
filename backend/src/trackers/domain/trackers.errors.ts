import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/domain-error';

export class TrackerAuthFailedError extends ValidationError {
  constructor(provider: string) {
    super(`Не удалось авторизоваться в ${provider}: проверьте логин и пароль`);
  }
}

export class TrackerUnavailableError extends ValidationError {
  constructor(provider: string, details: string) {
    super(`Трекер ${provider} недоступен: ${details}`);
  }
}

export class TrackerAlreadyConnectedError extends ConflictError {
  constructor(provider: string) {
    super(`Трекер ${provider} уже привязан к аккаунту`);
  }
}

export class TrackerAccountNotFoundError extends NotFoundError {
  constructor() {
    super('Привязка трекера не найдена');
  }
}

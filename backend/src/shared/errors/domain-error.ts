/** Домен бросает эти ошибки, не зная про HTTP: маппинг в статусы — в DomainExceptionFilter. */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {}

export class ConflictError extends DomainError {}

export class ForbiddenError extends DomainError {}

export class ValidationError extends DomainError {}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { GraphQLError } from 'graphql';

import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from './domain-error';

// Порядок важен: ошибки модулей наследуются от этих классов, проверка идёт через instanceof
const DOMAIN_ERROR_STATUS: Array<[new (...args: never[]) => DomainError, HttpStatus]> = [
  [NotFoundError, HttpStatus.NOT_FOUND],
  [ConflictError, HttpStatus.CONFLICT],
  [ForbiddenError, HttpStatus.FORBIDDEN],
  [ValidationError, HttpStatus.BAD_REQUEST],
];

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // У GraphQL нет HTTP-ответа: возвращаем ошибку, Apollo положит её в errors[]
    if (host.getType<'graphql'>() === 'graphql') {
      return this.toGraphQLError(exception);
    }

    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      const status = this.resolveStatus(exception);
      response.status(status).json({ statusCode: status, message: exception.message });
      return;
    }

    // Ошибки самого Nest (ValidationPipe, guard'ы) уже несут корректный статус
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    this.logger.error(
      'Необработанная ошибка',
      exception instanceof Error ? exception.stack : exception,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
    });
  }

  private toGraphQLError(exception: unknown): GraphQLError {
    if (exception instanceof DomainError) {
      const status = this.resolveStatus(exception);
      return new GraphQLError(exception.message, { extensions: { code: status } });
    }
    if (exception instanceof HttpException) {
      // у ValidationPipe сообщения по полям лежат в теле, а message — общий «Bad Request Exception»
      const body = exception.getResponse();
      const detail = typeof body === 'object' ? (body as { message?: string | string[] }).message : undefined;
      const message = Array.isArray(detail) ? detail.join('; ') : (detail ?? exception.message);
      return new GraphQLError(message, { extensions: { code: exception.getStatus() } });
    }

    this.logger.error(
      'Необработанная ошибка в GraphQL',
      exception instanceof Error ? exception.stack : exception,
    );
    return new GraphQLError('Внутренняя ошибка сервера', {
      extensions: { code: HttpStatus.INTERNAL_SERVER_ERROR },
    });
  }

  private resolveStatus(exception: DomainError): HttpStatus {
    return (
      DOMAIN_ERROR_STATUS.find(([type]) => exception instanceof type)?.[1] ??
      HttpStatus.BAD_REQUEST
    );
  }
}

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
import { SuperTokensExceptionFilter } from 'supertokens-nestjs';
import { Error as SuperTokensError } from 'supertokens-node';

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
  private readonly superTokens = new SuperTokensExceptionFilter();

  catch(exception: unknown, host: ArgumentsHost) {
    // Этот фильтр ловит всё, поэтому ошибки сессии отдаём SuperTokens сами: иначе
    // вместо 401 и обновления куки клиент получал бы 500
    if (SuperTokensError.isErrorFromSuperTokens(exception)) {
      if (host.getType<'graphql'>() === 'graphql') {
        return this.toSessionGraphQLError(exception);
      }
      return this.superTokens.catch(exception, host);
    }

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
      const status = exception.getStatus();
      const messages = extractMessages(exception);
      response.status(status).json({
        statusCode: status,
        message: messages.join('; '),
        ...(messages.length > 1 ? { details: messages } : {}),
      });
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

  private toSessionGraphQLError(exception: { type: string }): GraphQLError {
    const status =
      exception.type === 'INVALID_CLAIMS' ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
    return new GraphQLError(
      status === HttpStatus.FORBIDDEN ? 'Недостаточно прав' : 'Сессия не найдена или истекла',
      { extensions: { code: status } },
    );
  }

  private toGraphQLError(exception: unknown): GraphQLError {
    if (exception instanceof DomainError) {
      const status = this.resolveStatus(exception);
      return new GraphQLError(exception.message, { extensions: { code: status } });
    }
    if (exception instanceof HttpException) {
      return new GraphQLError(extractMessages(exception).join('; '), {
        extensions: { code: exception.getStatus() },
      });
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

/** У ValidationPipe сообщения по полям лежат в теле массивом, а message — общий «Bad Request Exception». */
function extractMessages(exception: HttpException): string[] {
  const body = exception.getResponse();
  const message = typeof body === 'object' ? (body as { message?: string | string[] }).message : body;
  if (Array.isArray(message)) {
    return message;
  }
  return [typeof message === 'string' ? message : exception.message];
}

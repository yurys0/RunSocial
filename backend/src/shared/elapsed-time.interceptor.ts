import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

export const ELAPSED_TIME_HEADER = 'X-Elapsed-Time';

@Injectable()
export class ElapsedTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ElapsedTimeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const target = this.resolveTarget(context);
    if (!target) {
      return next.handle();
    }

    const startedAt = process.hrtime.bigint();
    let reported = false;

    return next.handle().pipe(
      tap(() => {
        if (reported) {
          return;
        }
        reported = true;

        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const value = elapsedMs.toFixed(1);
        this.logger.log(`${target.label} — ${value} ms`);
        if (!target.response.headersSent) {
          target.response.setHeader(ELAPSED_TIME_HEADER, value);
        }
      }),
    );
  }

  private resolveTarget(context: ExecutionContext): { label: string; response: Response } | null {
    if (context.getType<'graphql'>() === 'graphql') {
      const gql = GqlExecutionContext.create(context);
      const info = gql.getInfo<{ path: { key: string; prev?: unknown } }>();
      if (info.path.prev) {
        return null;
      }
      const request = gql.getContext<{ req: Request }>().req;
      return { label: `GraphQL ${info.path.key}`, response: request.res! };
    }

    const request = context.switchToHttp().getRequest<Request>();
    return {
      label: `${request.method} ${request.originalUrl}`,
      response: context.switchToHttp().getResponse<Response>(),
    };
  }
}

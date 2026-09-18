import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { JwtAuthGuard, RequestWithUser } from './jwt-auth.guard';

/** Тот же JWT-guard: у GraphQL нет switchToHttp(), запрос достаём из контекста. */
@Injectable()
export class GqlAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext<{ req: RequestWithUser }>().req;

    return super.canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext);
  }
}

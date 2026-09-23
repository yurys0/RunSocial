import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SuperTokensAuthGuard } from 'supertokens-nestjs';

/** Тот же guard, что и в REST: у GraphQL нет switchToHttp(), запрос и ответ лежат в контексте. */
@Injectable()
export class GqlAuthGuard extends SuperTokensAuthGuard {
  constructor() {
    super((context) => {
      const gqlContext = GqlExecutionContext.create(context).getContext<{
        req: unknown;
        res: unknown;
      }>();
      return { request: gqlContext.req, response: gqlContext.res };
    });
  }
}

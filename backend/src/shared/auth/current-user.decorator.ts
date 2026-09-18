import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { AuthenticatedUser, RequestWithUser } from './jwt-auth.guard';

/** Работает и в REST, и в GraphQL: тип контекста определяется на месте. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    if (context.getType<'graphql'>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{ req: RequestWithUser }>().req.user!;
    }
    return context.switchToHttp().getRequest<RequestWithUser>().user!;
  },
);

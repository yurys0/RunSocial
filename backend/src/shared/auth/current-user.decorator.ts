import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SessionContainer } from 'supertokens-node/recipe/session';
import UserRoles from 'supertokens-node/recipe/userroles';
import { UserContext } from 'supertokens-node/types';

import { AuthenticatedUser } from './authenticated-user';
import { ADMIN_ROLE } from './roles';

type RequestWithSession = { session?: SessionContainer };

/** Работает и в REST, и в GraphQL: тип контекста определяется на месте. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const session = requestFromContext(context).session;
    if (!session) {
      throw new UnauthorizedException('Сессия не найдена');
    }

    // Роли SuperTokens кладёт в payload access-токена, отдельный запрос к ядру не нужен
    const roles = UserRoles.UserRoleClaim.getValueFromPayload(
      session.getAccessTokenPayload(),
      {} as UserContext,
    );
    return { userId: session.getUserId(), isAdmin: roles?.includes(ADMIN_ROLE) ?? false };
  },
);

function requestFromContext(context: ExecutionContext): RequestWithSession {
  if (context.getType<'graphql'>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<{ req: RequestWithSession }>().req;
  }
  return context.switchToHttp().getRequest<RequestWithSession>();
}

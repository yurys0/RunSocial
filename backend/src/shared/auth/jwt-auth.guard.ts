import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export type AuthenticatedUser = { userId: string; login: string };

export type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Токен не передан');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
      request.user = { userId: payload.userId, login: payload.login };
      return true;
    } catch {
      throw new UnauthorizedException('Токен недействителен или истёк');
    }
  }

  private extractToken(request: RequestWithUser): string | null {
    const [scheme, value] = (request.headers.authorization ?? '').split(' ');
    if (scheme === 'Bearer' && value) {
      return value;
    }
    // EventSource не умеет слать заголовки, поэтому для SSE токен приходит в query
    const queryToken = request.query?.token;
    return typeof queryToken === 'string' ? queryToken : null;
  }
}

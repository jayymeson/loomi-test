import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, JwtPayload } from '../services/auth.service';
import { ROLES_KEY } from 'src/decorator/decorator.roles';
import { IS_PUBLIC_KEY } from 'src/decorator/decorator.public';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não encontrado');
    }

    const token = authHeader.split(' ')[1];

    let payload: JwtPayload;
    try {
      payload = await this.authService.validateToken(token);
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado', error);
    }

    request.user = payload;

    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles) return true;

    if (!requiredRoles.includes(payload.role)) {
      throw new ForbiddenException('Acesso negado');
    }

    return true;
  }
}

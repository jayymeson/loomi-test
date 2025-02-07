import * as jwt from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  async generateToken(user: any): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado', error);
    }
  }
}

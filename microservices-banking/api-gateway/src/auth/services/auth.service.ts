import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/customer/modules/services/user.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async generateToken(user: any): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'USER',
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid token', error);
    }
  }

  async validateUserCredentials(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      return passwordMatch ? user : null;
    } catch (error) {
      throw error;
    }
  }
}

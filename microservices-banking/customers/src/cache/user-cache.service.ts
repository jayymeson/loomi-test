import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/users/interface/user.interface';

@Injectable()
export class UserCacheService {
  private readonly logger = new Logger(UserCacheService.name);
  private readonly cache = new Map<string, User>();

  updateUser(user: User): void {
    if (!user || !user.id) {
      this.logger.warn('Dados inválidos para atualização no cache.');
      return;
    }
    this.cache.set(user.id, user);
    this.logger.log(`Cliente ${user.id} atualizado no cache.`);
  }

  getUser(userId: string): User | null {
    return this.cache.get(userId) || null;
  }

  invalidateUser(userId: string): void {
    if (this.cache.delete(userId)) {
      this.logger.log(`Cliente ${userId} removido do cache.`);
    }
  }
}

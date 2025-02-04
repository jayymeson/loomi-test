import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { UserCacheService } from '../cache/user-cache.service';

@Injectable()
export class UserEventsConsumer {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(private readonly userCacheService: UserCacheService) {}

  @RabbitSubscribe({
    exchange: 'user-exchange',
    routingKey: 'user.created',
    queue: 'transaction-user-created',
  })
  public async handleUserCreated(user: any) {
    this.logger.log(`Evento recebido [user.created]: ${JSON.stringify(user)}`);
    this.userCacheService.updateUser(user);
  }

  @RabbitSubscribe({
    exchange: 'user-exchange',
    routingKey: 'user.updated',
    queue: 'transaction-user-updated',
  })
  public async handleUserUpdated(user: any) {
    this.logger.log(`Evento recebido [user.updated]: ${JSON.stringify(user)}`);
    this.userCacheService.updateUser(user);
  }
}

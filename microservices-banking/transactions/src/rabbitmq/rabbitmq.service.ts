import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  publish(routingKey: string, data: any) {
    this.logger.log(
      `[RabbitmqService][publish] Publish Message -> Exchange: transaction-exchange | RoutingKey: ${routingKey}}`,
    );
    this.amqpConnection.publish<any>('transaction-exchange', routingKey, data);
  }
}

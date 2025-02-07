import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RabbitmqRoutingKeys } from './enum/rabbitmq-events.enum';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  publish(routingKey: string, data: any) {
    this.logger.log(
      `[RabbitmqService][publish] Publish Message -> Exchange: transaction-exchange | RoutingKey: ${routingKey} | Message: ${JSON.stringify(data)}`,
    );

    this.amqpConnection.publish<any>(
      RabbitmqRoutingKeys.TRANSACTION_EXCHANGE,
      routingKey,
      data,
    );
  }
}

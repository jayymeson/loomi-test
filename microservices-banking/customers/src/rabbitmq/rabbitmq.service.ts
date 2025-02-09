import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RabbitmqRoutingKeys } from './enum/rabbitmq-events.enum';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  publish(routingKey: string, data: any) {
    this.logger.log(
      `[RabbitmqService][publish] Publish Message -> Exchange: user-exchange | RoutingKey: ${routingKey}}`,
    );

    this.amqpConnection.publish<any>(
      RabbitmqRoutingKeys.USER_EXCHANGE,
      routingKey,
      data,
    );
  }
}

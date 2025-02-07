import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  publish(routingKey: string, data: any) {
    this.logger.log(
      `📤 Publicando mensagem -> Exchange: user-exchange | RoutingKey: ${routingKey} | Payload: ${JSON.stringify(
        data,
      )}`,
    );

    this.amqpConnection.publish<any>('user-exchange', routingKey, data);
  }
}

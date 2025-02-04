import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RabbitmqPublisher {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  publish(exchange: string, routingKey: string, message: any) {
    this.amqpConnection.publish(exchange, routingKey, message);
  }
}

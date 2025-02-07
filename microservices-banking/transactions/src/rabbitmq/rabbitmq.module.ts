import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqRoutingKeys } from './enum/rabbitmq-events.enum';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: RabbitmqRoutingKeys.USER_EXCHANGE,
          type: RabbitmqRoutingKeys.TYPE,
        },
        {
          name: RabbitmqRoutingKeys.TRANSACTION_EXCHANGE,
          type: RabbitmqRoutingKeys.TYPE,
        },
      ],
      uri: `${process.env.URI_RABBITMQ_LOCAL}`,
      enableControllerDiscovery: false,
    }),
  ],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}

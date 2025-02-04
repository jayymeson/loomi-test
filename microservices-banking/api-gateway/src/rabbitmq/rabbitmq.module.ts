import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitmqService } from 'src/services/rabbitmq.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'amq.direct',
          type: 'direct',
        },
      ],
      uri: process.env.URI_RABBITMQ_LOCAL,
      enableControllerDiscovery: false,
    }),
  ],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}

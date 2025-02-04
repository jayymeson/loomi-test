import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule } from '@nestjs/config';
import { GatewayConsumer } from 'src/events/geteway.consume';
import { CacheService } from 'src/cache/cache.service';
import { GatewayController } from './geteway.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'customer-exchange',
          type: 'topic',
        },
      ],
      uri: process.env.URI_RABBITMQ_LOCAL || 'amqp://guest:guest@rabbitmq:5672',
      connectionInitOptions: { wait: false },
    }),
  ],
  controllers: [GatewayController],
  providers: [CacheService, GatewayConsumer],
})
export class GatewayModule {}

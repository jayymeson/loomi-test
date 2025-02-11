import { Module } from '@nestjs/common';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { TransactionModule } from './transaction/transaction.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { RabbitMQServiceMock } from './utils/mocks/rabbitmq.service.mock';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsModule } from './metrics/metrics.module';
import { RabbitmqRoutingKeys } from './rabbitmq/enum/rabbitmq-events.enum';

const isTestEnvironment = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    RabbitmqModule,
    PrometheusModule.register({
      defaultMetrics: {
        enabled: false,
      },
    }),
    MetricsModule,
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
      uri:
        `${process.env.URI_RABBITMQ_LOCAL}` ||
        'amqp://guest:guest@rabbitmq:5672',
      enableControllerDiscovery: !isTestEnvironment,
    }),
    TransactionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: RabbitmqService,
      useClass: isTestEnvironment ? RabbitMQServiceMock : RabbitmqService,
    },
  ],
})
export class AppModule {}

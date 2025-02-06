import { Module } from '@nestjs/common';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { TransactionModule } from './transaction/transaction.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
// etc.

@Module({
  imports: [
    RabbitmqModule,
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'amq.direct',
          type: 'direct',
        },
      ],
      uri:
        `${process.env.URI_RABBITMQ_LOCAL} ` ||
        'amqp://guest:guest@rabbitmq:5672',
    }),
    TransactionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: RabbitmqService,
      useClass: RabbitmqService,
    },
  ],
})
export class AppModule {}

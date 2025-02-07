import { Module } from '@nestjs/common';
import { TransactionsController } from './controller/transactions.controller';
import { TransactionsService } from './service/transactions.service';
import { TransactionsRepository } from './repositories/transactions.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { UserEventsConsumer } from 'src/events/user.events.consumer';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  imports: [RabbitmqModule, MetricsModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    UserEventsConsumer,
    PrismaService,
  ],
})
export class TransactionModule {}

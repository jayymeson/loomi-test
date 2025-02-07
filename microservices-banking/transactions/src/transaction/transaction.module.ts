import { Module } from '@nestjs/common';
import { TransactionsController } from './controller/transactions.controller';
import { TransactionsService } from './service/transactions.service';
import { TransactionsRepository } from './repositories/transactions.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { UserEventsConsumer } from 'src/events/user.events.consumer';

@Module({
  imports: [RabbitmqModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    UserEventsConsumer,
    PrismaService,
  ],
})
export class TransactionModule {}

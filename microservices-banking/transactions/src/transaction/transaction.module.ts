import { Module } from '@nestjs/common';
import { TransactionsController } from './controller/transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsService } from './service/transactions.service';
import { TransactionsRepository } from './repositories/transactions.repository';
import { UserEventsConsumer } from 'src/cache/user-events.consumer';

@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository, UserEventsConsumer],
})
export class TransactionModule {}

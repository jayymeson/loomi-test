import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersRepository } from '../repositories/users.repository';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { MetricsModule } from 'src/metrics/metrics.module';
import { TransactionEventsConsumer } from 'src/events/transaction.events.consumer';

@Module({
  imports: [RabbitmqModule, MetricsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    PrismaService,
    TransactionEventsConsumer,
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}

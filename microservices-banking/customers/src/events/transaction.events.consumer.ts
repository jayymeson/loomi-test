import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionEventsConsumer {
  private readonly logger = new Logger(TransactionEventsConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @RabbitSubscribe({
    exchange: 'transaction-exchange',
    routingKey: 'transaction.completed',
    queue: 'user-transaction-completed',
    createQueueIfNotExists: true,
  })
  public async handleTransactionCompleted(transactionPayload: any) {
    this.logger.log(
      `Event received [transaction.completed]: ${JSON.stringify(transactionPayload)}`,
    );

    const { senderUserId, receiverUserId, amount } = transactionPayload;

    if (!senderUserId || !receiverUserId || !amount || amount <= 0) {
      this.logger.error(
        `Invalid transaction event: sender=${senderUserId}, receiver=${receiverUserId}, amount=${amount}`,
      );
      return;
    }

    const sender = await this.prisma.user.update({
      where: { id: senderUserId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    if (!sender) {
      this.logger.error(`Sender user not found: ID ${senderUserId}`);
      throw new NotFoundException(`Sender user not found: ${senderUserId}`);
    }

    const receiver = await this.prisma.user.update({
      where: { id: receiverUserId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    if (!receiver) {
      this.logger.error(`Receiver user not found: ID ${receiverUserId}`);
      throw new NotFoundException(`Receiver user not found: ${receiverUserId}`);
    }

    this.logger.log(
      `Transaction completed: Sender ${senderUserId} -${amount}, Receiver ${receiverUserId} +${amount}`,
    );
  }
}

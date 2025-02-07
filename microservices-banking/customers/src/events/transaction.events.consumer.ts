import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitmqRoutingKeys } from 'src/rabbitmq/enum/rabbitmq-events.enum';

@Injectable()
export class TransactionEventsConsumer {
  private readonly logger = new Logger(TransactionEventsConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @RabbitSubscribe({
    exchange: RabbitmqRoutingKeys.TRANSACTION_EXCHANGE,
    routingKey: RabbitmqRoutingKeys.TRANSACTION_COMPLETED,
    queue: RabbitmqRoutingKeys.USER_TRANSACTION_COMPLETED,
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

  @RabbitSubscribe({
    exchange: RabbitmqRoutingKeys.TRANSACTION_EXCHANGE,
    routingKey: RabbitmqRoutingKeys.TRANSACTION_CANCELED,
    queue: RabbitmqRoutingKeys.USER_TRANSACTION_CANCELED,
    createQueueIfNotExists: true,
  })
  public async handleTransactionCanceled(transactionPayload: any) {
    this.logger.log(
      `Event received [transaction.canceled]: ${JSON.stringify(transactionPayload)}`,
    );

    const { senderUserId, receiverUserId, amount } = transactionPayload;

    if (!senderUserId || !receiverUserId || !amount || amount <= 0) {
      this.logger.error(
        `Invalid cancellation event: sender=${senderUserId}, receiver=${receiverUserId ?? 'MISSING'}, amount=${amount}`,
      );
      return;
    }

    const sender = await this.prisma.user.update({
      where: { id: senderUserId },
      data: {
        balance: {
          increment: amount,
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
          decrement: amount,
        },
      },
    });

    if (!receiver) {
      this.logger.error(`Receiver user not found: ID ${receiverUserId}`);
      throw new NotFoundException(`Receiver user not found: ${receiverUserId}`);
    }

    this.logger.log(
      `Transaction canceled: Sender ${senderUserId} +${amount}, Receiver ${receiverUserId} -${amount}`,
    );
  }
}

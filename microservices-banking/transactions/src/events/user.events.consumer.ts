import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserEventsConsumer {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @RabbitSubscribe({
    exchange: 'user-exchange',
    routingKey: 'user.created',
    queue: 'transaction-user-created',
    createQueueIfNotExists: true,
  })
  public async handleUserCreated(userPayload: any) {
    this.logger.log(
      `Event received [user.created]: ${JSON.stringify(userPayload)}`,
    );

    const { id, name, email, bankingDetails } = userPayload;

    const user = await this.prisma.user.upsert({
      where: { id },
      update: {
        name,
        email,
        agency: bankingDetails?.agency,
        account: bankingDetails?.account,
      },
      create: {
        id,
        name,
        email,
        agency: bankingDetails?.agency,
        account: bankingDetails?.account,
      },
    });

    const userBalanceExists = await this.prisma.userBalance.findUnique({
      where: { userId: id },
    });

    if (!userBalanceExists) {
      await this.prisma.userBalance.create({
        data: {
          userId: id,
          balance: 0,
        },
      });

      this.logger.log(
        `UserBalance created with initial balance for user ID: ${id}`,
      );
    }
  }

  @RabbitSubscribe({
    exchange: 'user-exchange',
    routingKey: 'user.updated',
    queue: 'transaction-user-updated',
  })
  public async handleUserUpdated(userPayload: any) {
    this.logger.log(
      `Evento recebido [user.updated]: ${JSON.stringify(userPayload)}`,
    );

    const { id, name, email, bankingDetails } = userPayload;

    if (!bankingDetails || !bankingDetails.agency || !bankingDetails.account) {
      this.logger.error(` Evento inválido recebido! Falta agency/account.`);
      return;
    }

    await this.prisma.user.upsert({
      where: { id },
      update: {
        name,
        email,
        agency: bankingDetails?.agency,
        account: bankingDetails?.account,
      },
      create: {
        id,
        name,
        email,
        agency: bankingDetails?.agency,
        account: bankingDetails?.account,
      },
    });
  }

  @RabbitSubscribe({
    exchange: 'user-exchange',
    routingKey: 'user.deposit',
    queue: 'transaction-user-deposit',
    createQueueIfNotExists: true,
  })
  public async handleUserDeposit(depositPayload: any) {
    this.logger.log(
      `Event received [user.deposit]: ${JSON.stringify(depositPayload)}`,
    );

    const userId = depositPayload.userId;
    const amount = depositPayload.amount;

    if (!userId || !amount || amount <= 0) {
      this.logger.error(`Deposit invalid: userId=${userId}, amount=${amount}`);
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(`User not found for deposit: ID ${userId}`);
      throw new NotFoundException(`User not found: ${userId}`);
    }

    await this.prisma.userBalance.update({
      where: { userId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    this.logger.log(
      `Deposit of ${amount} done successfully for user ID: ${userId}`,
    );
  }
}

// user-events.consumer.ts (no Transaction Service)
import { Injectable, Logger } from '@nestjs/common';
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
  })
  public async handleUserCreated(userPayload: any) {
    this.logger.log(
      `Evento recebido [user.created]: ${JSON.stringify(userPayload)}`,
    );

    const { id, name, email, bankingDetails } = userPayload;

    // Se no Transaction Service o model "User" tiver as colunas `agency` e `account`
    // diretas, você pode fazer algo simples:
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
    routingKey: 'user.updated',
    queue: 'transaction-user-updated',
  })
  public async handleUserUpdated(userPayload: any) {
    this.logger.log(
      `Evento recebido [user.updated]: ${JSON.stringify(userPayload)}`,
    );

    const { id, name, email, bankingDetails } = userPayload;

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
}

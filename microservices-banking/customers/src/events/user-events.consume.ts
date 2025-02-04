import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserEventsConsumer {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(private readonly prismaService: PrismaService) {}

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
    await this.prismaService.user.upsert({
      where: { id },
      update: {
        name,
        email,
        bankingDetails: bankingDetails
          ? {
              upsert: {
                create: {
                  agency: bankingDetails.agency,
                  account: bankingDetails.account,
                },
                update: {
                  agency: bankingDetails.agency,
                  account: bankingDetails.account,
                },
              },
            }
          : undefined,
      },
      create: {
        id,
        name,
        email,
        bankingDetails: bankingDetails
          ? {
              create: {
                agency: bankingDetails.agency,
                account: bankingDetails.account,
              },
            }
          : undefined,
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

    await this.prismaService.user.upsert({
      where: { id },
      update: {
        name,
        email,
        bankingDetails: bankingDetails
          ? {
              upsert: {
                create: {
                  agency: bankingDetails.agency,
                  account: bankingDetails.account,
                },
                update: {
                  agency: bankingDetails.agency,
                  account: bankingDetails.account,
                },
              },
            }
          : undefined,
      },
      create: {
        id,
        name,
        email,
        bankingDetails: bankingDetails
          ? {
              create: {
                agency: bankingDetails.agency,
                account: bankingDetails.account,
              },
            }
          : undefined,
      },
    });
  }
}

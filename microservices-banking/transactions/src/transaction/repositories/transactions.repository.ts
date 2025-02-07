import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Prisma, Transaction } from '@prisma/client';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSenderAndReceiverDetails(
    senderUserId: string,
    receiverUserId: string,
  ) {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderUserId },
      include: { balance: true },
    });

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverUserId },
      include: { balance: true },
    });

    return { sender, receiver };
  }

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        senderUserId: dto.senderUserId,
        receiverUserId: dto.receiverUserId,
        amount: dto.amount,
        description: dto.description,
      },
      include: {
        senderUser: true,
        receiverUser: true,
      },
    });
  }

  async updateBalances(
    senderUserId: string,
    receiverUserId: string,
    amount: number,
  ): Promise<void> {
    const senderBalance = await this.prisma.userBalance.findUnique({
      where: { userId: senderUserId },
    });

    const receiverBalance = await this.prisma.userBalance.findUnique({
      where: { userId: receiverUserId },
    });

    if (!senderBalance) {
      await this.prisma.userBalance.create({
        data: {
          userId: senderUserId,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    if (!receiverBalance) {
      await this.prisma.userBalance.create({
        data: {
          userId: receiverUserId,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    await this.prisma.userBalance.update({
      where: { userId: senderUserId },
      data: { balance: { decrement: amount } },
    });

    await this.prisma.userBalance.update({
      where: { userId: receiverUserId },
      data: { balance: { increment: amount } },
    });
  }

  async findById(transactionId: string): Promise<Transaction> {
    return this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        senderUser: true,
        receiverUser: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        OR: [{ senderUserId: userId }, { receiverUserId: userId }],
      },
      include: {
        senderUser: true,
        receiverUser: true,
      },
    });
  }
}

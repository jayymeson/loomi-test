import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction } from '@prisma/client';

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
    await this.prisma.$transaction(async (prisma) => {
      await prisma.userBalance.update({
        where: { userId: senderUserId },
        data: { balance: { decrement: amount } },
      });

      await prisma.userBalance.update({
        where: { userId: receiverUserId },
        data: { balance: { increment: amount } },
      });
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

  async updateTransactionStatus(
    transactionId: string,
    status: string,
  ): Promise<void> {
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status },
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

  async getUserWithBalance(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { balance: true },
    });
  }

  async findRecentTransactions(days: number): Promise<Transaction[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: dateThreshold,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        senderUser: true,
        receiverUser: true,
      },
    });
  }
}

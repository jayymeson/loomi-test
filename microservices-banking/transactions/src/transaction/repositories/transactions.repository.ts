import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction } from '@prisma/client';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

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

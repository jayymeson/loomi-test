import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Transaction } from '@prisma/client';
import { TransactionsRepository } from '../repositories/transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const sender = await this.prisma.user.findUnique({
      where: { id: dto.senderUserId },
    });
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverUserId },
    });

    if (!sender || !receiver) {
      throw new NotFoundException(
        'Sender or Receiver user not found in Transaction Service DB',
      );
    }

    const transaction =
      await this.transactionsRepository.createTransaction(dto);

    return transaction;
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    const transaction =
      await this.transactionsRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return this.transactionsRepository.findByUserId(userId);
  }
}

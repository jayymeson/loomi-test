import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Prisma, Transaction } from '@prisma/client';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const { sender, receiver } =
      await this.transactionsRepository.getSenderAndReceiverDetails(
        dto.senderUserId,
        dto.receiverUserId,
      );

    if (!sender || !receiver) {
      throw new NotFoundException(
        'Sender or Receiver user not found in Transaction Service DB',
      );
    }

    if (
      !sender.balance ||
      new Prisma.Decimal(sender.balance.balance).toNumber() < dto.amount
    ) {
      throw new UnprocessableEntityException(
        `Insufficient funds: User ${dto.senderUserId} has balance ${sender.balance?.balance.toNumber()}, required ${dto.amount}`,
      );
    }

    const transaction =
      await this.transactionsRepository.createTransaction(dto);
    await this.transactionsRepository.updateBalances(
      dto.senderUserId,
      dto.receiverUserId,
      dto.amount,
    );
    this.rabbitmqService.publish('transaction.completed', transaction);

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

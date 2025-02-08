import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Prisma, Transaction } from '@prisma/client';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { RabbitmqRoutingKeys } from 'src/rabbitmq/enum/rabbitmq-events.enum';
import { InsufficientFundsException } from 'src/exceptions/insufficient-funds.exception';
import { TransactionNotFoundException } from 'src/exceptions/transaction-not-found.exception';
import { InvalidTransactionException } from 'src/exceptions/invalid-transaction.exception';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  /**
   * Creates a new transaction between users and updates their balances.
   * Publishes an event to RabbitMQ upon successful completion.
   *
   * @param {CreateTransactionDto} dto - DTO containing transaction details
   * @returns {Promise<Transaction>} - Created transaction entity
   * @throws {NotFoundException} If sender or receiver does not exist
   * @throws {InvalidTransactionException} If sender is the same person
   * @throws {TransactionNotFoundException} If sender not found
   */
  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    try {
      this.logger.log(
        `[createTransaction] Initiating transaction: ${JSON.stringify(dto)}`,
      );

      if (dto.senderUserId === dto.receiverUserId) {
        throw new InvalidTransactionException(
          'Sender and receiver cannot be the same',
        );
      }

      await this.validateSenderBalance(dto.senderUserId, dto.amount);

      const { sender, receiver } =
        await this.transactionsRepository.getSenderAndReceiverDetails(
          dto.senderUserId,
          dto.receiverUserId,
        );

      if (!sender || !receiver) {
        throw new TransactionNotFoundException(
          'Sender or Receiver user not found in Transaction Service DB',
        );
      }

      const transaction =
        await this.transactionsRepository.createTransaction(dto);

      await this.transactionsRepository.updateBalances(
        dto.senderUserId,
        dto.receiverUserId,
        dto.amount,
      );

      this.logger.log(
        `[createTransaction] Transaction created successfully: ID=${transaction.id}`,
      );

      this.rabbitmqService.publish(
        RabbitmqRoutingKeys.TRANSACTION_COMPLETED,
        transaction,
      );

      return transaction;
    } catch (error) {
      this.logger.error(
        `[createTransaction] Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieves a transaction by its ID.
   *
   * @param {string} transactionId - ID of the transaction to retrieve
   * @returns {Promise<Transaction>} - The found transaction entity
   * @throws {NotFoundException} If the transaction is not found
   */
  async getTransactionById(transactionId: string): Promise<Transaction> {
    this.logger.log(
      `[getTransactionById] Fetching transaction ID: ${transactionId}`,
    );

    const transaction =
      await this.transactionsRepository.findById(transactionId);

    if (!transaction) {
      this.logger.warn(
        `[getTransactionById] Transaction not found with ID: ${transactionId}`,
      );
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Retrieves all transactions for a specific user.
   *
   * @param {string} userId - ID of the user whose transactions should be retrieved
   * @returns {Promise<Transaction[]>} - List of transactions involving the user
   */
  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    this.logger.log(
      `[getTransactionsByUserId] Fetching transactions for user ID: ${userId}`,
    );

    return this.transactionsRepository.findByUserId(userId);
  }

  /**
   * Cancels a transaction by ID, reverting the amount to the sender's balance.
   *
   * @param {string} transactionId - ID of the transaction to cancel
   * @throws {NotFoundException} If the transaction does not exist
   * @throws {UnprocessableEntityException} If the transaction is already processed
   */
  async cancelTransaction(transactionId: string): Promise<void> {
    this.logger.log(
      `[cancelTransaction] Attempting to cancel transaction ID: ${transactionId}`,
    );

    const transaction =
      await this.transactionsRepository.findById(transactionId);

    if (!transaction) {
      this.logger.warn(
        `[cancelTransaction] Transaction not found: ID=${transactionId}`,
      );
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      this.logger.warn(
        `[cancelTransaction] Cannot cancel transaction ID=${transactionId} because it is already ${transaction.status}`,
      );
      throw new UnprocessableEntityException(
        `Transaction cannot be canceled because it is already ${transaction.status}`,
      );
    }

    await this.transactionsRepository.updateBalances(
      transaction.senderUserId,
      transaction.receiverUserId,
      -transaction.amount,
    );

    await this.transactionsRepository.updateTransactionStatus(
      transactionId,
      'CANCELED',
    );

    this.logger.log(
      `[cancelTransaction] Transaction ID=${transactionId} has been canceled`,
    );

    this.logger.log(
      `[cancelTransaction] Publishing TRANSACTION_CANCELED event: sender=${transaction.senderUserId}, receiver=${transaction.receiverUserId}, amount=${transaction.amount}`,
    );

    this.rabbitmqService.publish(RabbitmqRoutingKeys.TRANSACTION_CANCELED, {
      transactionId,
      senderUserId: transaction.senderUserId,
      amount: transaction.amount,
    });
  }

  private async validateSenderBalance(
    senderUserId: string,
    amount: number,
  ): Promise<void> {
    try {
      const sender =
        await this.transactionsRepository.getUserWithBalance(senderUserId);

      if (
        !sender?.balance ||
        new Prisma.Decimal(sender.balance.balance).toNumber() < amount
      ) {
        throw new InsufficientFundsException(
          `Insufficient funds: User ${senderUserId} has balance ${sender.balance?.balance.toNumber()}, required ${amount}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[validateSenderBalance] Error: ${error.message}`,
        error.stack,
      );
      throw error; // Re-lança a exceção personalizada
    }
  }

  /**
   * Retrieves recent transactions within the last X days.
   *
   * @param {number} days - Number of days to filter transactions
   * @returns {Promise<Transaction[]>} - List of recent transactions
   */
  async getRecentTransactions(days: number): Promise<Transaction[]> {
    this.logger.log(
      `[getRecentTransactions] Fetching transactions from the last ${days} days`,
    );

    const transactions =
      await this.transactionsRepository.findRecentTransactions(days);

    this.logger.log(
      `[getRecentTransactions] Found ${transactions.length} transactions in the last ${days} days`,
    );

    return transactions;
  }
}

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
   * @throws {UnprocessableEntityException} If sender has insufficient funds
   */
  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    this.logger.log(
      `[createTransaction] Initiating transaction: ${JSON.stringify(dto)}`,
    );

    const { sender, receiver } =
      await this.transactionsRepository.getSenderAndReceiverDetails(
        dto.senderUserId,
        dto.receiverUserId,
      );

    if (!sender || !receiver) {
      this.logger.warn(
        `[createTransaction] Sender or receiver not found: sender=${dto.senderUserId}, receiver=${dto.receiverUserId}`,
      );
      throw new NotFoundException(
        'Sender or Receiver user not found in Transaction Service DB',
      );
    }

    if (
      !sender.balance ||
      new Prisma.Decimal(sender.balance.balance).toNumber() < dto.amount
    ) {
      this.logger.warn(
        `[createTransaction] Insufficient funds for sender ID: ${dto.senderUserId}`,
      );
      throw new UnprocessableEntityException(
        `Insufficient funds: User ${dto.senderUserId} has balance ${sender.balance?.balance.toNumber()}, required ${dto.amount}`,
      );
    }

    this.logger.log(
      `[createTransaction] Creating transaction from sender=${dto.senderUserId} to receiver=${dto.receiverUserId} amount=${dto.amount}`,
    );

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

    // Publicando o evento para o RabbitMQ
    this.logger.log(
      `[createTransaction] Publishing event ${RabbitmqRoutingKeys.TRANSACTION_COMPLETED} to RabbitMQ`,
    );

    this.rabbitmqService.publish(
      RabbitmqRoutingKeys.TRANSACTION_COMPLETED,
      transaction,
    );

    return transaction;
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

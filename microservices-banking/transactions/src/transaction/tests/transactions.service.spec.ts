import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TransactionsService } from '../service/transactions.service';
import { InsufficientFundsException } from 'src/exceptions/insufficient-funds.exception';
import { TransactionNotFoundException } from 'src/exceptions/transaction-not-found.exception';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockTransactionsRepository = {
    getSenderAndReceiverDetails: jest.fn(),
    createTransaction: jest.fn(),
    updateBalances: jest.fn(),
    findById: jest.fn(),
    updateTransactionStatus: jest.fn(),
    findByUserId: jest.fn(),
    findRecentTransactions: jest.fn(),
    getUserWithBalance: jest.fn(),
  };

  const mockRabbitmqService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: mockTransactionsRepository,
        },
        {
          provide: RabbitmqService,
          useValue: mockRabbitmqService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const dto: CreateTransactionDto = {
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        description: 'Test transaction',
      };

      mockTransactionsRepository.getUserWithBalance.mockResolvedValue({
        id: 'senderId',
        balance: { balance: new Prisma.Decimal(500) },
      });

      mockTransactionsRepository.getSenderAndReceiverDetails.mockResolvedValue({
        sender: {
          id: 'senderId',
          balance: { balance: new Prisma.Decimal(500) },
        },
        receiver: {
          id: 'receiverId',
          balance: { balance: new Prisma.Decimal(300) },
        },
      });

      mockTransactionsRepository.createTransaction.mockResolvedValue({
        id: 'transactionId',
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createTransaction(dto);

      expect(
        mockTransactionsRepository.getUserWithBalance,
      ).toHaveBeenCalledWith('senderId');
      expect(
        mockTransactionsRepository.getSenderAndReceiverDetails,
      ).toHaveBeenCalledWith('senderId', 'receiverId');
      expect(mockTransactionsRepository.createTransaction).toHaveBeenCalledWith(
        dto,
      );
      expect(mockTransactionsRepository.updateBalances).toHaveBeenCalledWith(
        'senderId',
        'receiverId',
        100,
      );
      expect(mockRabbitmqService.publish).toHaveBeenCalled();
      expect(result.id).toBe('transactionId');
    });

    it('should throw TransactionNotFoundException if sender or receiver does not exist', async () => {
      const dto: CreateTransactionDto = {
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        description: 'Test',
      };

      mockTransactionsRepository.getSenderAndReceiverDetails.mockResolvedValue({
        sender: null,
        receiver: null,
      });

      await expect(service.createTransaction(dto)).rejects.toThrow(
        TransactionNotFoundException,
      );
    });

    it('should throw InsufficientFundsException if sender has insufficient balance', async () => {
      const dto: CreateTransactionDto = {
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 1000,
        description: 'Test',
      };

      mockTransactionsRepository.getUserWithBalance.mockResolvedValue({
        id: 'senderId',
        balance: { balance: new Prisma.Decimal(100) },
      });

      await expect(service.createTransaction(dto)).rejects.toThrow(
        InsufficientFundsException,
      );
    });
  });

  describe('getTransactionById', () => {
    it('should return the transaction if it exists', async () => {
      mockTransactionsRepository.findById.mockResolvedValue({ id: 'transId' });

      const result = await service.getTransactionById('transId');

      expect(mockTransactionsRepository.findById).toHaveBeenCalledWith(
        'transId',
      );
      expect(result.id).toBe('transId');
    });

    it('should throw NotFoundException if the transaction does not exist', async () => {
      mockTransactionsRepository.findById.mockResolvedValue(null);

      await expect(service.getTransactionById('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactionsByUserId', () => {
    it('should return a list of user transactions', async () => {
      const mockTransactions = [
        {
          id: 't1',
          senderUserId: 'userId',
          receiverUserId: 'any1',
          amount: 10,
        },
        {
          id: 't2',
          senderUserId: 'any2',
          receiverUserId: 'userId',
          amount: 20,
        },
      ];
      mockTransactionsRepository.findByUserId.mockResolvedValue(
        mockTransactions,
      );

      const result = await service.getTransactionsByUserId('userId');

      expect(mockTransactionsRepository.findByUserId).toHaveBeenCalledWith(
        'userId',
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('t1');
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel a pending transaction and revert balances', async () => {
      const transaction = {
        id: 'tx1',
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        status: 'PENDING',
      };
      mockTransactionsRepository.findById.mockResolvedValue(transaction);

      await service.cancelTransaction('tx1');

      expect(mockTransactionsRepository.findById).toHaveBeenCalledWith('tx1');
      expect(mockTransactionsRepository.updateBalances).toHaveBeenCalledWith(
        'senderId',
        'receiverId',
        -100,
      );
      expect(
        mockTransactionsRepository.updateTransactionStatus,
      ).toHaveBeenCalledWith('tx1', 'CANCELED');
      expect(mockRabbitmqService.publish).toHaveBeenCalled();
    });

    it('should throw NotFoundException if the transaction does not exist', async () => {
      mockTransactionsRepository.findById.mockResolvedValue(null);

      await expect(service.cancelTransaction('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnprocessableEntityException if the transaction is not PENDING', async () => {
      const transaction = {
        id: 'tx1',
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        status: 'COMPLETED',
      };
      mockTransactionsRepository.findById.mockResolvedValue(transaction);

      await expect(service.cancelTransaction('tx1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('getRecentTransactions', () => {
    it('should return recent transactions', async () => {
      const mockTransactions = [
        { id: 't1', createdAt: new Date() },
        { id: 't2', createdAt: new Date() },
      ];
      mockTransactionsRepository.findRecentTransactions.mockResolvedValue(
        mockTransactions,
      );

      const result = await service.getRecentTransactions(7);

      expect(
        mockTransactionsRepository.findRecentTransactions,
      ).toHaveBeenCalledWith(7);
      expect(result).toHaveLength(2);
    });
  });
});

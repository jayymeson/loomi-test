import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '../service/transactions.service';
import { MetricsService } from 'src/metrics/metrics.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { TransactionsController } from '../controller/transactions.controller';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  const mockTransactionsService = {
    createTransaction: jest.fn(),
    getTransactionById: jest.fn(),
    getTransactionsByUserId: jest.fn(),
    cancelTransaction: jest.fn(),
    getRecentTransactions: jest.fn(),
  };

  const mockMetricsService = {
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: mockTransactionsService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should call service.createTransaction and return void', async () => {
      const dto: CreateTransactionDto = {
        senderUserId: '123',
        receiverUserId: '456',
        amount: 100,
        description: 'Test',
      };

      const result = await controller.createTransaction(dto);

      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(mockTransactionsService.createTransaction).toHaveBeenCalledWith(
        dto,
      );
      expect(result).toBeUndefined();
    });
  });

  describe('getTransactionById', () => {
    it('should return the transaction if it exists', async () => {
      const mockTransaction = { id: 'tx1' } as Transaction;
      mockTransactionsService.getTransactionById.mockResolvedValue(
        mockTransaction,
      );

      const result = await controller.getTransactionById('tx1');

      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(mockTransactionsService.getTransactionById).toHaveBeenCalledWith(
        'tx1',
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if the transaction does not exist', async () => {
      mockTransactionsService.getTransactionById.mockRejectedValue(
        new NotFoundException(),
      );
      await expect(controller.getTransactionById('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactionsByUserId', () => {
    it('should return a list of user transactions', async () => {
      const mockTransactions = [{ id: 't1' }, { id: 't2' }] as Transaction[];
      mockTransactionsService.getTransactionsByUserId.mockResolvedValue(
        mockTransactions,
      );

      const result = await controller.getTransactionsByUserId('user123');

      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(
        mockTransactionsService.getTransactionsByUserId,
      ).toHaveBeenCalledWith('user123');
      expect(result).toHaveLength(2);
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel the transaction', async () => {
      mockTransactionsService.cancelTransaction.mockResolvedValue(undefined);
      await controller.cancelTransaction('tx1');

      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(mockTransactionsService.cancelTransaction).toHaveBeenCalledWith(
        'tx1',
      );
    });
  });

  describe('getRecentTransactions', () => {
    it('should return recent transactions', async () => {
      const mockTransactions = [{ id: 't1' }, { id: 't2' }] as Transaction[];
      mockTransactionsService.getRecentTransactions.mockResolvedValue(
        mockTransactions,
      );

      const result = await controller.getRecentTransactions(7);

      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(
        mockTransactionsService.getRecentTransactions,
      ).toHaveBeenCalledWith(7);
      expect(result).toHaveLength(2);
    });
  });
});

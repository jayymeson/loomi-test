import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '../service/transactions.service';
import { MetricsService } from 'src/metrics/metrics.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { TransactionsController } from '../controller/transactions.controller';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  // Mocks
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
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);

    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('deve chamar o service.createTransaction e retornar void', async () => {
      // Arrange
      const dto: CreateTransactionDto = {
        senderUserId: '123',
        receiverUserId: '456',
        amount: 100,
        description: 'Teste',
      };

      // Act
      const result = await controller.createTransaction(dto);

      // Assert
      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(mockTransactionsService.createTransaction).toHaveBeenCalledWith(
        dto,
      );
      expect(result).toBeUndefined(); // pois o método não retorna nada (void)
    });
  });

  describe('getTransactionById', () => {
    it('deve retornar a transação se existir', async () => {
      // Arrange
      const mockTransaction = { id: 'tx1' } as Transaction;
      mockTransactionsService.getTransactionById.mockResolvedValue(
        mockTransaction,
      );

      // Act
      const result = await controller.getTransactionById('tx1');

      // Assert
      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(mockTransactionsService.getTransactionById).toHaveBeenCalledWith(
        'tx1',
      );
      expect(result).toEqual(mockTransaction);
    });

    it('deve lançar NotFoundException se não existir', async () => {
      // Arrange
      mockTransactionsService.getTransactionById.mockRejectedValue(
        new NotFoundException(),
      );

      // Act & Assert
      await expect(controller.getTransactionById('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactionsByUserId', () => {
    it('deve retornar lista de transações do user', async () => {
      // Arrange
      const mockTransactions = [{ id: 't1' }, { id: 't2' }] as Transaction[];
      mockTransactionsService.getTransactionsByUserId.mockResolvedValue(
        mockTransactions,
      );

      // Act
      const result = await controller.getTransactionsByUserId('user123');

      // Assert
      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(
        mockTransactionsService.getTransactionsByUserId,
      ).toHaveBeenCalledWith('user123');
      expect(result).toHaveLength(2);
    });
  });

  describe('cancelTransaction', () => {
    it('deve cancelar a transação', async () => {
      // Arrange
      mockTransactionsService.cancelTransaction.mockResolvedValue(undefined);

      // Act
      await controller.cancelTransaction('tx1');

      // Assert
      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(mockTransactionsService.cancelTransaction).toHaveBeenCalledWith(
        'tx1',
      );
    });
  });

  describe('getRecentTransactions', () => {
    it('deve retornar transações recentes', async () => {
      // Arrange
      const mockTransactions = [{ id: 't1' }, { id: 't2' }] as Transaction[];
      mockTransactionsService.getRecentTransactions.mockResolvedValue(
        mockTransactions,
      );

      // Act
      const result = await controller.getRecentTransactions(7);

      // Assert
      expect(mockMetricsService.increment).toHaveBeenCalled();
      expect(
        mockTransactionsService.getRecentTransactions,
      ).toHaveBeenCalledWith(7);
      expect(result).toHaveLength(2);
    });
  });
});

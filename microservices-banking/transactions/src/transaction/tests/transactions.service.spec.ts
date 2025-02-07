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

describe('TransactionsService', () => {
  let service: TransactionsService;

  // Mocks
  const mockTransactionsRepository = {
    getSenderAndReceiverDetails: jest.fn(),
    createTransaction: jest.fn(),
    updateBalances: jest.fn(),
    findById: jest.fn(),
    updateTransactionStatus: jest.fn(),
    findByUserId: jest.fn(),
    findRecentTransactions: jest.fn(),
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

    // "Reseta" os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('deve criar uma transação com sucesso', async () => {
      // Arrange
      const dto: CreateTransactionDto = {
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        description: 'Teste de transação',
      };

      // Simulamos que os usuários existem e que o sender tem saldo suficiente
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

      // Simulamos que a transação foi criada no banco
      mockTransactionsRepository.createTransaction.mockResolvedValue({
        id: 'transactionId',
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.createTransaction(dto);

      // Assert
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
      expect(mockRabbitmqService.publish).toHaveBeenCalled(); // Verifica se publicou no RabbitMQ
      expect(result.id).toBe('transactionId');
    });

    it('deve lançar NotFoundException se sender ou receiver não existir', async () => {
      // Arrange
      const dto: CreateTransactionDto = {
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        description: 'Teste',
      };

      // Simulamos que o sender ou receiver não existe
      mockTransactionsRepository.getSenderAndReceiverDetails.mockResolvedValue({
        sender: null,
        receiver: null,
      });

      // Act & Assert
      await expect(service.createTransaction(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar UnprocessableEntityException se sender não tiver saldo', async () => {
      // Arrange
      const dto: CreateTransactionDto = {
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 1000,
        description: 'Teste',
      };

      // Simulamos que existe o sender, mas sem saldo suficiente
      mockTransactionsRepository.getSenderAndReceiverDetails.mockResolvedValue({
        sender: {
          id: 'senderId',
          balance: { balance: new Prisma.Decimal(100) },
        },
        receiver: {
          id: 'receiverId',
          balance: { balance: new Prisma.Decimal(300) },
        },
      });

      // Act & Assert
      await expect(service.createTransaction(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('getTransactionById', () => {
    it('deve retornar a transação se existir', async () => {
      // Arrange
      mockTransactionsRepository.findById.mockResolvedValue({ id: 'transId' });

      // Act
      const result = await service.getTransactionById('transId');

      // Assert
      expect(mockTransactionsRepository.findById).toHaveBeenCalledWith(
        'transId',
      );
      expect(result.id).toBe('transId');
    });

    it('deve lançar NotFoundException se a transação não for encontrada', async () => {
      // Arrange
      mockTransactionsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getTransactionById('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactionsByUserId', () => {
    it('deve retornar uma lista de transações de um usuário', async () => {
      // Arrange
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

      // Act
      const result = await service.getTransactionsByUserId('userId');

      // Assert
      expect(mockTransactionsRepository.findByUserId).toHaveBeenCalledWith(
        'userId',
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('t1');
    });
  });

  describe('cancelTransaction', () => {
    it('deve cancelar uma transação pendente e reverter saldo', async () => {
      // Arrange
      const transaction = {
        id: 'tx1',
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        status: 'PENDING',
      };
      mockTransactionsRepository.findById.mockResolvedValue(transaction);

      // Act
      await service.cancelTransaction('tx1');

      // Assert
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

    it('deve lançar NotFoundException se a transação não existir', async () => {
      // Arrange
      mockTransactionsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancelTransaction('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar UnprocessableEntityException se a transação não estiver PENDING', async () => {
      // Arrange
      const transaction = {
        id: 'tx1',
        senderUserId: 'senderId',
        receiverUserId: 'receiverId',
        amount: 100,
        status: 'COMPLETED',
      };
      mockTransactionsRepository.findById.mockResolvedValue(transaction);

      // Act & Assert
      await expect(service.cancelTransaction('tx1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('getRecentTransactions', () => {
    it('deve retornar transações recentes', async () => {
      // Arrange
      const mockTransactions = [
        { id: 't1', createdAt: new Date() },
        { id: 't2', createdAt: new Date() },
      ];
      mockTransactionsRepository.findRecentTransactions.mockResolvedValue(
        mockTransactions,
      );

      // Act
      const result = await service.getRecentTransactions(7);

      // Assert
      expect(
        mockTransactionsRepository.findRecentTransactions,
      ).toHaveBeenCalledWith(7);
      expect(result).toHaveLength(2);
    });
  });
});

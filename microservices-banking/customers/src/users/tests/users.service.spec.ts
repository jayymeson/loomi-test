import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../repositories/users.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../interface/user.interface';
import { UsersService } from '../services/users.service';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ErrorMessages } from '../enum/error.message.enum';
import * as admin from 'firebase-admin';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const rabbitmqServiceMock = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            updateProfilePicture: jest.fn(),
            deposit: jest.fn(),
          },
        },
        {
          provide: RabbitmqService,
          useValue: rabbitmqServiceMock,
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue({
                id: '123',
                name: 'John Doe',
                email: 'john.doe@example.com',
                address: '123 Main St',
                profilePicture: 'https://example.com/profile.jpg',
                balance: new Prisma.Decimal(50),
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'P@ssw0rd!',
        address: '123 Main St',
        bankingDetails: {
          agency: '1234',
          account: '56789',
        },
        profilePicture: 'https://example.com/profile.jpg',
      };

      const user: User = {
        id: '123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        bankingDetails: createUserDto.bankingDetails,
        profilePicture: createUserDto.profilePicture,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'create').mockResolvedValue(user);

      expect(await service.createUser(createUserDto)).toEqual(user);
    });
  });

  describe('deposit', () => {
    it('should deposit money into user account', async () => {
      // Mockando o método `findById` do repositório para retornar um usuário existente
      jest.spyOn(repository, 'findById').mockResolvedValue({
        id: '123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        profilePicture: 'https://example.com/profile.jpg',
        balance: new Prisma.Decimal(50), // Saldo inicial
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Mockando `deposit` para simular um depósito bem-sucedido
      jest.spyOn(repository, 'deposit').mockResolvedValue(undefined);

      // Chama o serviço de depósito
      await service.deposit('123', 100);

      // Verifica se `deposit` foi chamado corretamente no repositório
      expect(repository.deposit).toHaveBeenCalledWith('123', 100);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.deposit('not-existing', 100)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getUserById', () => {
    it('should return the user when found', async () => {
      const userId = '123';
      const userExpected: User = {
        id: userId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        bankingDetails: { agency: '1234', account: '56789' },
        profilePicture: 'https://example.com/profile.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(userExpected);
      const result = await service.getUserById(userId);
      expect(result).toEqual(userExpected);
    });

    it('should log warning if user is not found', async () => {
      const userId = 'not-found';
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      const result = await service.getUserById(userId);
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update the user and publish event', async () => {
      const userId = '123';
      const updateUserDto: UpdateUserDto = { name: 'Jane Doe' };

      const userExpected: User = {
        id: userId,
        name: 'Jane Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        bankingDetails: { agency: '1234', account: '56789' },
        profilePicture: 'https://example.com/profile.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'update').mockResolvedValue(userExpected);

      const result = await service.updateUser(userId, updateUserDto);
      expect(result).toEqual(userExpected);
    });
  });

  describe('updateProfilePicture', () => {
    it('should update profile picture when file is provided', async () => {
      const userId = '123';
      const file: Express.Multer.File = {
        fieldname: 'profilePicture',
        originalname: 'profile.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('dummy-content'),
        size: 1024,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const fakeUrl = `https://storage.googleapis.com/fake-bucket/fakefile.jpg`;
      const mockFile = { save: jest.fn().mockResolvedValue(undefined) };
      const mockBucket = {
        file: jest.fn().mockReturnValue(mockFile),
        name: 'fake-bucket',
      };
      const adminStorageSpy = jest
        .spyOn(admin, 'storage')
        .mockReturnValue({ bucket: () => mockBucket } as any);

      const userExpected: User = {
        id: userId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        bankingDetails: { agency: '1234', account: '56789' },
        profilePicture: fakeUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, 'updateProfilePicture')
        .mockResolvedValue(userExpected);

      const result = await service.updateProfilePicture(userId, file);
      expect(result).toEqual(userExpected);
      expect(mockBucket.file).toHaveBeenCalled();
      expect(mockFile.save).toHaveBeenCalledWith(file.buffer, {
        metadata: { contentType: file.mimetype },
      });

      adminStorageSpy.mockRestore();
    });

    it('should throw error when no file provided', async () => {
      await expect(
        service.updateProfilePicture('123', undefined),
      ).rejects.toThrow(ErrorMessages.NO_PICTURE_PROVIDED);
    });
  });
});

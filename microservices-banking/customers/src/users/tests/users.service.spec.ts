import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../repositories/users.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../interface/user.interface';
import { UsersService } from '../services/users.service';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserNotFoundException } from 'src/exceptions/user-not-found.exception';
import { BaseException } from 'src/exceptions/base-exception';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;
  let rabbitmqService: RabbitmqService;

  const mockUser: User = {
    id: '123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'hashed-password',
    address: '123 Main St',
    bankingDetails: { agency: '1234', account: '56789' },
    profilePicture: 'https://example.com/profile.jpg',
    balance: new Prisma.Decimal(100),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            findById: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            updateProfilePicture: jest.fn().mockResolvedValue(mockUser),
            deposit: jest.fn().mockResolvedValue(undefined),
            findByEmail: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: RabbitmqService,
          useValue: {
            publish: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
    rabbitmqService = module.get<RabbitmqService>(RabbitmqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user and publish event', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'P@ssw0rd!',
        bankingDetails: {
          agency: '1234',
          account: '56789',
        },
      };

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith(expect.any(Object));
      expect(rabbitmqService.publish).toHaveBeenCalledWith(
        'user.created',
        mockUser,
      );
    });
  });

  describe('deposit', () => {
    it('should deposit money and publish event', async () => {
      const depositDto = { amount: 100 };

      await service.deposit('123', depositDto);

      expect(repository.deposit).toHaveBeenCalledWith('123', depositDto.amount);
      expect(rabbitmqService.publish).toHaveBeenCalledWith('user.deposit', {
        userId: '123',
        amount: depositDto.amount,
      });
    });

    it('should throw UserNotFoundException', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValueOnce(null);

      await expect(service.deposit('invalid', { amount: 100 })).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return user', async () => {
      const result = await service.getUserById('123');
      expect(result).toEqual(mockUser);
    });

    it('should throw UserNotFoundException', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValueOnce(null);

      await expect(service.getUserById('invalid')).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('updateProfilePicture', () => {
    it('should update with valid file', async () => {
      const mockFile = {
        fieldname: 'profilePicture',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const result = await service.updateProfilePicture('123', mockFile);

      expect(result.profilePicture).toBeDefined();
      expect(rabbitmqService.publish).toHaveBeenCalledWith(
        'user.updated',
        mockUser,
      );
    });

    it('should throw BaseException when no file', async () => {
      await expect(
        service.updateProfilePicture('123', undefined),
      ).rejects.toThrow(BaseException);
    });
  });
});

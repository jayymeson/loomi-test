import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../repositories/users.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../interface/user.interface';
import { UsersService } from '../services/users.service';
import { RabbitMQServiceMock } from '../../utils/mocks/rabbitmq.service.mock';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;
  let rabbitMQServiceMock: RabbitMQServiceMock;

  beforeEach(async () => {
    rabbitMQServiceMock = new RabbitMQServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        UsersRepository,
        PrismaService,
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            updateProfilePicture: jest.fn(),
          },
        },
        {
          provide: RabbitmqService,
          useValue: rabbitMQServiceMock,
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
});

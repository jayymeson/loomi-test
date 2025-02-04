import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { AppModule } from '../../user.module';
import { RabbitMQServiceMock } from '../../utils/mocks/rabbitmq.service.mock';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';

jest.setTimeout(20000);

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let rabbitMQServiceMock: RabbitMQServiceMock;

  const usersService = {
    createUser: (dto: CreateUserDto) => ({
      id: '1',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  beforeAll(async () => {
    rabbitMQServiceMock = new RabbitMQServiceMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersService)
      .useValue(usersService)
      .overrideProvider(RabbitmqService)
      .useValue(rabbitMQServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .field('name', 'John Doe')
      .field('email', 'john.doe@example.com')
      .field('address', '123 Main St')
      .field(
        'bankingDetails',
        JSON.stringify({ agency: '1234', account: '56789' }),
      )
      .attach('profilePicture', './path/to/profilePicture.jpg') // substitua pelo caminho correto
      .expect(201)
      .expect((res) => {
        expect(res.body).toEqual({
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          address: '123 Main St',
          bankingDetails: {
            agency: '1234',
            account: '56789',
          },
          profilePicture: expect.stringContaining(
            'https://storage.googleapis.com/',
          ),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});

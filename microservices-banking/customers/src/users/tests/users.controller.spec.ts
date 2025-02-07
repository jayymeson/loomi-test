import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';
import { MetricsService } from 'src/metrics/metrics.service';

jest.setTimeout(20000);

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersService: Partial<UsersService>;

  beforeAll(async () => {
    usersService = {
      createUser: jest.fn().mockResolvedValue(undefined),
      getUserById: jest.fn().mockResolvedValue({
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        bankingDetails: { agency: '1234', account: '56789' },
        profilePicture: 'https://storage.googleapis.com/fake/profile.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateUser: jest.fn().mockResolvedValue(undefined),
      updateProfilePicture: jest.fn().mockResolvedValue(undefined),
      deposit: jest.fn().mockResolvedValue(undefined),
    };

    // Cria o módulo de teste incluindo todas as dependências necessárias
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: RabbitmqService, useValue: { publish: jest.fn() } },
        { provide: MetricsService, useValue: { increment: jest.fn() } }, // Fornecendo MetricsService mockado
      ],
    }).compile();

    // Cria a aplicação a partir do módulo e inicializa-a
    app = module.createNestApplication();
    await app.init();
  });

  it('/api/users (POST) - should create user and return 204 No Content', async () => {
    const testImagePath = path.resolve(__dirname, 'test-profile-picture.jpg');
    fs.writeFileSync(testImagePath, Buffer.from('dummy-content'));

    return request(app.getHttpServer())
      .post('/api/users')
      .field('name', 'John Doe')
      .field('email', 'john.doe@example.com')
      .field('address', '123 Main St')
      .field(
        'bankingDetails',
        JSON.stringify({ agency: '1234', account: '56789' }),
      )
      .attach('profilePicture', testImagePath)
      .expect(204);
  });

  it('/api/users/:userId (GET) - should return user data', () => {
    return request(app.getHttpServer())
      .get('/api/users/1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          address: '123 Main St',
          bankingDetails: { agency: '1234', account: '56789' },
          profilePicture: expect.stringContaining(
            'https://storage.googleapis.com/',
          ),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
  });

  it('/api/users/:userId/deposit (POST) - should deposit money into user account', async () => {
    return request(app.getHttpServer())
      .post('/api/users/123/deposit')
      .send({ amount: 100 })
      .expect(204);
  });

  it('/api/users/:userId (PATCH) - should update user', () => {
    return request(app.getHttpServer())
      .patch('/api/users/1')
      .send({ name: 'Jane Doe' })
      .expect(204);
  });

  it('/api/users/:userId/profile-picture (PATCH) - should update profile picture', () => {
    const testImagePath = path.resolve(__dirname, 'test-image.jpg');
    fs.writeFileSync(testImagePath, Buffer.from('dummy-content'));

    return request(app.getHttpServer())
      .patch('/api/users/1/profile-picture')
      .attach('profilePicture', testImagePath)
      .expect(204);
  });

  afterAll(async () => {
    await app.close();
  });
});

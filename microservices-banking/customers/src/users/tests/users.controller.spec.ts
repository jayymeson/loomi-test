import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';
import { MetricsService } from 'src/metrics/metrics.service';
import { UserNotFoundException } from 'src/exceptions/user-not-found.exception';
import { ErrorMessages } from '../enum/error.message.enum';
import { Prisma } from '@prisma/client';

jest.setTimeout(20000);

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersService: Partial<UsersService>;
  let testImagePath: string;

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
        balance: new Prisma.Decimal(100),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateUser: jest.fn().mockResolvedValue(undefined),
      updateProfilePicture: jest.fn().mockResolvedValue(undefined),
      deposit: jest.fn().mockResolvedValue(undefined),
      findByEmail: jest.fn().mockResolvedValue({
        id: '1',
        email: 'john.doe@example.com',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        {
          provide: RabbitmqService,
          useValue: {
            publish: jest.fn(),
            getPublishedMessages: jest.fn().mockReturnValue([]),
          },
        },
        { provide: MetricsService, useValue: { increment: jest.fn() } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    testImagePath = path.resolve(__dirname, 'test-image.jpg');
    fs.writeFileSync(testImagePath, Buffer.from('dummy-content'));
  });

  afterAll(async () => {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    await app.close();
  });

  describe('/api/users (POST)', () => {
    it('should create user and return 204 No Content', async () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .field('name', 'John Doe')
        .field('email', 'john.doe@example.com')
        .field('password', 'P@ssw0rd!')
        .field('address', '123 Main St')
        .field(
          'bankingDetails',
          JSON.stringify({ agency: '1234', account: '56789' }),
        )
        .attach('profilePicture', testImagePath)
        .expect(204)
        .then(() => {
          expect(usersService.createUser).toHaveBeenCalled();
        });
    });
  });

  describe('/api/users/:userId (GET)', () => {
    it('should return user data', () => {
      return request(app.getHttpServer())
        .get('/api/users/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            balance: '100',
          });
        });
    });

    it('should return 404 if user not found', () => {
      jest
        .spyOn(usersService, 'getUserById')
        .mockRejectedValueOnce(new UserNotFoundException('User not found'));

      return request(app.getHttpServer())
        .get('/api/users/999')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('User not found');
        });
    });
  });

  describe('/api/users/:userId/deposit (POST)', () => {
    it('/api/users/:userId/deposit (POST) - should deposit money into user account', async () => {
      return request(app.getHttpServer())
        .post('/api/users/1/deposit')
        .send({ amount: 100 })
        .expect(204)
        .then(() => {
          expect(usersService.deposit).toHaveBeenCalledWith('1', {
            amount: 100,
          });
        });
    });
  });

  describe('/api/users/:userId/profile-picture (PATCH)', () => {
    it('should update profile picture', () => {
      return request(app.getHttpServer())
        .patch('/api/users/1/profile-picture')
        .attach('profilePicture', testImagePath)
        .expect(204)
        .then(() => {
          expect(usersService.updateProfilePicture).toHaveBeenCalled();
        });
    });

    it('should return 400 if no file provided', () => {
      return request(app.getHttpServer())
        .patch('/api/users/1/profile-picture')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(ErrorMessages.NO_PICTURE_PROVIDED);
        });
    });
  });
});

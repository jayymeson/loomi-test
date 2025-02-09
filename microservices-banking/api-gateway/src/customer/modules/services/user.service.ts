import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MICROSERVICES } from 'src/config/services';
import { CreateUserDto } from 'src/customer/dto/create-user.dto';
import * as admin from 'firebase-admin';
import { UpdateUserDto } from 'src/customer/dto/udate-user.dto';
import { User } from 'src/customer/interface/user.interface';
import * as FormData from 'form-data';
import { Readable } from 'stream';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly http: HttpService) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.SERVICE_ACCOUNT) as admin.ServiceAccount,
        ),
        storageBucket: 'loomi-3cc7a.appspot.com',
      });
    }
  }

  private handleMicroserviceError(error: any, context: string) {
    this.logger.error(`Error in ${context}: ${error.message}`, error.stack);
    const statusCode =
      error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const errorData = error.response?.data || {
      message: 'Internal server error',
      error: 'UnknownError',
    };

    const response = {
      statusCode,
      message: errorData.message || 'Internal server error',
      error: errorData.error || 'UnknownError',
      timestamp: errorData.timestamp || new Date().toISOString(),
      path: errorData.path || 'unknown',
      stack:
        process.env.NODE_ENV === 'development'
          ? errorData.stack || error.stack
          : undefined,
    };

    throw new HttpException(response, statusCode);
  }

  async createUser(body: CreateUserDto) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${MICROSERVICES.USERS}`, body),
      );
      return response.data;
    } catch (error) {
      this.handleMicroserviceError(error, 'createUser');
    }
  }

  async deposit(userId: string, amount: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${MICROSERVICES.USERS}/${userId}/deposit`, { amount }),
      );
    } catch (error) {
      this.handleMicroserviceError(error, 'deposit');
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.USERS}/${userId}`),
      );
      return response.data;
    } catch (error) {
      this.handleMicroserviceError(error, 'getUserById');
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.USERS}/email/${email}`),
      );
      return response.data;
    } catch (error) {
      this.handleMicroserviceError(error, 'findByEmail');
    }
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${MICROSERVICES.USERS}/${userId}`, updateUserDto),
      );
    } catch (error) {
      this.handleMicroserviceError(error, 'updateUser');
    }
  }

  async updateProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', Readable.from(file.buffer), {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      await firstValueFrom(
        this.http.patch(
          `${MICROSERVICES.USERS}/${userId}/profile-picture`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
          },
        ),
      );
    } catch (error) {
      this.handleMicroserviceError(error, 'updateProfilePicture');
    }
  }
}

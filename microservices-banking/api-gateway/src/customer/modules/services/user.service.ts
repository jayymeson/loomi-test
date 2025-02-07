import { Injectable, HttpException, NotFoundException } from '@nestjs/common';
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

  async createUser(body: CreateUserDto) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${MICROSERVICES.USERS}`, body),
      );

      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data, error.response?.status);
    }
  }

  async deposit(userId: string, amount: number): Promise<void> {
    await firstValueFrom(
      this.http.post(`${MICROSERVICES.USERS}/${userId}/deposit`, { amount }),
    );
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.USERS}/${userId}`),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('User not found');
      }
      throw new HttpException(error.response?.data, error.response?.status);
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.USERS}/email/${email}`),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`User not found with email: ${email}`);
      }
      throw new HttpException(error.response?.data, error.response?.status);
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
      throw new HttpException(error.response?.data, error.response?.status);
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
      throw new HttpException(error.response?.data, error.response?.status);
    }
  }
}

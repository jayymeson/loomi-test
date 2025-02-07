import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../interface/user.interface';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rabbitmqService: RabbitmqService,
  ) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.SERVICE_ACCOUNT) as admin.ServiceAccount,
        ),
        storageBucket: 'loomi-3cc7a.appspot.com',
      });
    }
  }

  async createUser(
    createUserDto: CreateUserDto,
    file?: Express.Multer.File,
  ): Promise<User> {
    try {
      if (file) {
        const bucket = admin.storage().bucket();
        const filename = `${uuidv4()}_${file.originalname}`;
        const fileUpload = bucket.file(filename);

        await fileUpload.save(file.buffer, {
          metadata: { contentType: file.mimetype },
        });

        const profilePicture = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        createUserDto.profilePicture = profilePicture;
      }

      const user = await this.usersRepository.create(createUserDto);
      this.rabbitmqService.publish('user.created', user);
      return user;
    } catch (error) {
      // TODO: alterar os logs de erros
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const targetFields = error.meta?.target as string[] | undefined;

          if (
            Array.isArray(targetFields) &&
            targetFields.includes('agency_account_unique')
          ) {
            throw new ConflictException('Os dados bancários já estão em uso.');
          }

          throw new ConflictException('E-mail já está em uso.');
        }
      }
      throw new InternalServerErrorException('Erro ao criar usuário.');
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.usersRepository.findById(userId);
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    try {
      const user = await this.usersRepository.update(userId, updateUserDto);
      this.rabbitmqService.publish('user.updated', user);
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateProfilePicture(
    userId: string,
    file?: Express.Multer.File,
  ): Promise<User> {
    if (!file) {
      throw new Error(`Nenhuma imagem foi enviada para o usuário ${userId}.`);
    }

    try {
      const bucket = admin.storage().bucket();
      const filename = `${uuidv4()}_${file.originalname}`;
      const fileUpload = bucket.file(filename);

      await fileUpload.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });

      const profilePicture = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      const user = await this.usersRepository.updateProfilePicture(
        userId,
        profilePicture,
      );
      this.rabbitmqService.publish('user.updated', user);
      return user;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }
}

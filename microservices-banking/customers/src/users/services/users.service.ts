import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '../../repositories/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../interface/user.interface';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { ErrorMessages } from '../enum/error.message.enum';
import { RabbitmqRoutingKeys } from 'src/rabbitmq/enum/rabbitmq-events.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rabbitmqService: RabbitmqService,
  ) {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.SERVICE_ACCOUNT) as admin.ServiceAccount,
        ),
        storageBucket: 'loomi-3cc7a.appspot.com',
      });
    }
  }

  /**
   * Creates a new user, optionally uploading the profile picture to Firebase Storage.
   * Publishes an event to RabbitMQ after successful creation.
   *
   * @param {CreateUserDto} createUserDto - DTO containing user data
   * @param {Express.Multer.File} [file]  - Optional file for profile picture
   * @returns {Promise<User>} - Created User entity
   */
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
      this.logger.log(
        `[UsersService] [createUser] User created with ID: ${user.id}`,
      );

      this.rabbitmqService.publish(RabbitmqRoutingKeys.USER_CREATED, user);
      return user;
    } catch (error) {
      this.logger.error(
        `[UsersService] [createUser] Error while creating user: ${error?.message}`,
        error?.stack,
      );

      if (error instanceof PrismaClientKnownRequestError) {
        this.handlePrismaError(error);
      }

      throw new InternalServerErrorException(
        ErrorMessages.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Deposits a specified amount to a user's balance.
   *
   * @param {string} userId - The ID of the user
   * @param {number} amount - Amount to deposit
   */
  async deposit(userId: string, amount: number): Promise<void> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      this.logger.warn(
        `[UsersService] [deposit] User not found with ID: ${userId}`,
      );
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.deposit(userId, amount);
    const depositPayload = { userId, amount };
    this.rabbitmqService.publish(
      RabbitmqRoutingKeys.USER_DEPOSIT,
      depositPayload,
    );

    this.logger.log(
      `[UsersService] [deposit] Deposit successful for user ID: ${userId}`,
    );
  }

  /**
   * Retrieves a user by their ID.
   *
   * @param {string} userId - The ID of the user to retrieve
   * @returns {Promise<User>} - The found user or throws an error
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.usersRepository.findById(userId);
      if (!user) {
        this.logger.warn(
          `[UsersService] [getUserById] User not found for ID: ${userId}`,
        );
      }
      return user;
    } catch (error) {
      this.logger.error(
        `[UsersService] [getUserById] Error fetching user by ID: ${userId} - ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Updates an existing user with the provided data.
   * Publishes an event to RabbitMQ after successful update.
   *
   * @param {string} userId - The ID of the user to update
   * @param {UpdateUserDto} updateUserDto - DTO containing updated user data
   * @returns {Promise<User>} - Updated User entity
   */
  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    try {
      const user = await this.usersRepository.update(userId, updateUserDto);
      this.logger.log(
        `[UsersService] [updateUser] User updated with ID: ${user.id}`,
      );
      this.rabbitmqService.publish(RabbitmqRoutingKeys.USER_UPDATED, user);
      return user;
    } catch (error) {
      this.logger.error(
        `[UsersService] [updateUser] Error updating user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Updates the profile picture of an existing user by uploading a new file.
   * Publishes an event to RabbitMQ after successful update.
   *
   * @param {string} userId - The ID of the user to update
   * @param {Express.Multer.File} [file] - The new profile picture file
   * @returns {Promise<User>} - Updated User entity
   */
  async updateProfilePicture(
    userId: string,
    file?: Express.Multer.File,
  ): Promise<User> {
    if (!file) {
      this.logger.error(
        `[UsersService] [updateProfilePicture] No file provided for user ID: ${userId}`,
      );
      throw new Error(ErrorMessages.NO_PICTURE_PROVIDED);
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
      this.logger.log(
        `[UsersService] [updateProfilePicture] Profile picture updated for user ID: ${user.id}`,
      );

      this.rabbitmqService.publish(RabbitmqRoutingKeys.USER_UPDATED, user);
      return user;
    } catch (error) {
      this.logger.error(
        `[UsersService] [updateProfilePicture] Error updating profile picture for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle Prisma-specific errors, transforming them into the appropriate HTTP exception.
   * This helps to keep catch blocks clean and maintain a single responsibility.
   */
  private handlePrismaError(error: PrismaClientKnownRequestError): never {
    if (error.code === 'P2002') {
      const targetFields = error.meta?.target as string[] | undefined;
      if (
        Array.isArray(targetFields) &&
        targetFields.includes('agency_account_unique')
      ) {
        throw new ConflictException(ErrorMessages.BANKING_DETAILS_IN_USE);
      }
      throw new ConflictException(ErrorMessages.USER_ALREADY_EXISTS);
    }
    throw error;
  }
}

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../interface/user.interface';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { ErrorMessages } from '../enum/error.message.enum';
import { RabbitmqRoutingKeys } from 'src/rabbitmq/enum/rabbitmq-events.enum';
import * as bcrypt from 'bcrypt';
import { DepositDto } from '../dto/create-deposit.dto';
import { UserNotFoundException } from 'src/exceptions/user-not-found.exception';
import { EmailAlreadyExistsException } from 'src/exceptions/email-already-exists.exception';
import { BaseException } from 'src/exceptions/base-exception';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

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
      const existingUser = await this.usersRepository.findByEmail(
        createUserDto.email,
      );

      if (existingUser) {
        this.logger.warn(
          `[createUser] Email already in use: ${createUserDto.email}`,
        );
        throw new EmailAlreadyExistsException(
          `Email ${createUserDto.email} is already in use`,
        );
      }
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

      const saltRounds = 10;
      createUserDto.password = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      const user = await this.usersRepository.create(createUserDto);
      this.logger.log(
        `[UsersService] [createUser] User created with ID: ${user.id}`,
      );

      this.rabbitmqService.publish(RabbitmqRoutingKeys.USER_CREATED, user);
      return user;
    } catch (error) {
      this.logger.error(`[createUser] Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find client by email.
   *
   * @param {string} email - The email of the user
   *
   */
  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  /**
   * Deposits a specified amount to a user's balance.
   *
   * @param {string} userId - The ID of the user
   * @param {DepositDto} depositDto - DTO Deposit
   */
  async deposit(userId: string, depositDto: DepositDto): Promise<void> {
    const { amount } = depositDto;

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      this.logger.warn(
        `[UsersService] [deposit] User not found with ID: ${userId}`,
      );
      throw new UserNotFoundException('User not found');
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
    this.logger.log(`[getUserById] Fetching user with ID: ${userId}`);

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      this.logger.warn(`[getUserById] User not found with ID: ${userId}`);
      throw new UserNotFoundException(`User with ID ${userId} not found`);
    }

    return user;
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
      throw new BaseException(
        ErrorMessages.NO_PICTURE_PROVIDED,
        HttpStatus.BAD_REQUEST,
      );
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
}

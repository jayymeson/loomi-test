import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../interface/user.interface';
import { plainToInstance } from 'class-transformer';
import { Express } from 'express';
import { MetricsService } from 'src/metrics/metrics.service';

@ApiTags('users')
@Controller('api/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly metricsService: MetricsService,
  ) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error occurred while creating the user.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post()
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User data + optional profile picture file',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        address: { type: 'string', example: '123 Main St' },
        bankingDetails: {
          type: 'object',
          properties: {
            agency: { type: 'string', example: '1234' },
            account: { type: 'string', example: '56789' },
          },
        },
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createUser(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    if (file) {
      this.logger.log(
        `[UsersController] [createUser] Received file: ${file.originalname}`,
      );
    }

    const createUserDto = plainToInstance(CreateUserDto, {
      ...body,
      bankingDetails: body.bankingDetails,
    });

    await this.usersService.createUser(createUserDto, file);
    this.logger.log(
      '[UsersController] [createUser] User created successfully.',
    );
    this.metricsService.increment();
    return;
  }

  @ApiOperation({ summary: 'Deposit money into user account' })
  @ApiResponse({ status: 200, description: 'Deposit successful' })
  @ApiResponse({ status: 400, description: 'Invalid deposit amount' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':userId/deposit')
  async deposit(
    @Param('userId') userId: string,
    @Body() body: { amount: number },
  ): Promise<void> {
    if (body.amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }
    await this.usersService.deposit(userId, body.amount);
    return;
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns the user data.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error while fetching user data.',
  })
  @Get(':userId')
  async getUserById(@Param('userId') userId: string): Promise<User> {
    this.logger.log(
      `[UsersController] [getUserById] Fetching user ID: ${userId}`,
    );
    this.metricsService.increment();
    return this.usersService.getUserById(userId);
  }

  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error while updating user.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    await this.usersService.updateUser(userId, updateUserDto);
    this.logger.log(
      '[UsersController] [updateUser] User updated successfully.',
    );
    this.metricsService.increment();
    return;
  }

  @ApiOperation({ summary: 'Update profile picture by ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile picture has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error while updating profile picture.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':userId/profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile picture file',
    schema: {
      type: 'object',
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async updateProfilePicture(
    @Param('userId') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<void> {
    if (!file) {
      this.logger.error(
        `[UsersController] [updateProfilePicture] No file provided for user ID: ${userId}`,
      );
      throw new BadRequestException('You must provide a file to update.');
    }

    await this.usersService.updateProfilePicture(userId, file);
    this.logger.log(
      '[UsersController] [updateProfilePicture] Profile picture updated successfully.',
    );
    this.metricsService.increment();
    return;
  }
}

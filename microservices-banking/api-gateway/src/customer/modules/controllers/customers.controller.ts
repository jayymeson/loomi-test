import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
  Patch,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UsersService } from '../services/customers.service';
import { CreateUserDto } from 'src/customer/dto/create-user.dto';
import { Public } from 'src/decorator/decorator.public';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { UpdateUserDto } from 'src/customer/dto/udate-user.dto';
import { User } from 'src/customer/interface/user.interface';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersService: UsersService) {}

  @Public()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request – Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict – Email already exists' })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable Entity – Validation errors',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal Server Error – Unexpected error while processing the request',
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User data with an optional profile picture file',
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
    @Body() body: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<void> {
    if (file) {
      this.logger.log(
        `[UsersController] [createUser] Received file: ${file.originalname}`,
      );
    }

    await this.usersService.createUser(body, file);
    return;
  }

  @UseGuards(JwtAuthGuard)
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
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns the user data.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get(':userId')
  async getUserById(@Param('userId') userId: string): Promise<User> {
    return this.usersService.getUserById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    await this.usersService.updateUser(userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a users profile picture' })
  @ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Erro interno.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':userId/profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file for profile picture',
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
      throw new BadRequestException(
        'You need to upload a file to update your profile picture.',
      );
    }

    await this.usersService.updateProfilePicture(userId, file);
    return;
  }
}
